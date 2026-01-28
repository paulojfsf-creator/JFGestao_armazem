from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from openpyxl import Workbook

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

JWT_SECRET = os.environ.get('JWT_SECRET', 'warehouse-construction-secret-key-2024')
JWT_ALGORITHM = 'HS256'

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== AUTH MODELS ====================
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    email: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# ==================== RESOURCE MODELS ====================
class ResourceBase(BaseModel):
    name: str
    quantity: int = 1
    location: str = ""
    status: str = "available"  # available, in_use, maintenance, broken
    obra_id: Optional[str] = None

class MachineCreate(ResourceBase):
    next_maintenance: Optional[str] = None
    maintenance_interval_days: int = 90

class Machine(MachineCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str = "machine"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class EquipmentCreate(ResourceBase):
    pass

class Equipment(EquipmentCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str = "equipment"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ToolCreate(ResourceBase):
    pass

class Tool(ToolCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str = "tool"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class VehicleCreate(ResourceBase):
    plate: str = ""
    next_maintenance: Optional[str] = None
    maintenance_interval_days: int = 30

class Vehicle(VehicleCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str = "vehicle"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class MaterialCreate(ResourceBase):
    unit: str = "unidade"

class Material(MaterialCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str = "material"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ==================== OBRA MODELS ====================
class ObraCreate(BaseModel):
    name: str
    address: str = ""
    client_name: str = ""
    status: str = "active"  # active, completed, paused

class Obra(ObraCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ==================== ASSIGNMENT MODEL ====================
class AssignmentCreate(BaseModel):
    resource_id: str
    resource_type: str  # machine, equipment, tool, vehicle, material
    obra_id: str

# ==================== AUTH FUNCTIONS ====================
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== AUTH ROUTES ====================
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(data: UserCreate):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "name": data.name,
        "email": data.email,
        "password": hash_password(data.password),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id)
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user_id, name=data.name, email=data.email)
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"])
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user["id"], name=user["name"], email=user["email"])
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user=Depends(get_current_user)):
    return UserResponse(id=user["id"], name=user["name"], email=user["email"])

# ==================== MACHINES ROUTES ====================
@api_router.get("/machines", response_model=List[Machine])
async def get_machines(user=Depends(get_current_user)):
    items = await db.machines.find({}, {"_id": 0}).to_list(1000)
    return items

@api_router.post("/machines", response_model=Machine)
async def create_machine(data: MachineCreate, user=Depends(get_current_user)):
    machine = Machine(**data.model_dump())
    doc = machine.model_dump()
    await db.machines.insert_one(doc)
    return machine

@api_router.put("/machines/{machine_id}", response_model=Machine)
async def update_machine(machine_id: str, data: MachineCreate, user=Depends(get_current_user)):
    existing = await db.machines.find_one({"id": machine_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Machine not found")
    
    update_data = data.model_dump()
    await db.machines.update_one({"id": machine_id}, {"$set": update_data})
    updated = await db.machines.find_one({"id": machine_id}, {"_id": 0})
    return updated

@api_router.delete("/machines/{machine_id}")
async def delete_machine(machine_id: str, user=Depends(get_current_user)):
    result = await db.machines.delete_one({"id": machine_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Machine not found")
    return {"message": "Machine deleted"}

# ==================== EQUIPMENT ROUTES ====================
@api_router.get("/equipment", response_model=List[Equipment])
async def get_equipment(user=Depends(get_current_user)):
    items = await db.equipment.find({}, {"_id": 0}).to_list(1000)
    return items

@api_router.post("/equipment", response_model=Equipment)
async def create_equipment(data: EquipmentCreate, user=Depends(get_current_user)):
    equipment = Equipment(**data.model_dump())
    doc = equipment.model_dump()
    await db.equipment.insert_one(doc)
    return equipment

@api_router.put("/equipment/{equipment_id}", response_model=Equipment)
async def update_equipment(equipment_id: str, data: EquipmentCreate, user=Depends(get_current_user)):
    existing = await db.equipment.find_one({"id": equipment_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    update_data = data.model_dump()
    await db.equipment.update_one({"id": equipment_id}, {"$set": update_data})
    updated = await db.equipment.find_one({"id": equipment_id}, {"_id": 0})
    return updated

@api_router.delete("/equipment/{equipment_id}")
async def delete_equipment(equipment_id: str, user=Depends(get_current_user)):
    result = await db.equipment.delete_one({"id": equipment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return {"message": "Equipment deleted"}

# ==================== TOOLS ROUTES ====================
@api_router.get("/tools", response_model=List[Tool])
async def get_tools(user=Depends(get_current_user)):
    items = await db.tools.find({}, {"_id": 0}).to_list(1000)
    return items

@api_router.post("/tools", response_model=Tool)
async def create_tool(data: ToolCreate, user=Depends(get_current_user)):
    tool = Tool(**data.model_dump())
    doc = tool.model_dump()
    await db.tools.insert_one(doc)
    return tool

@api_router.put("/tools/{tool_id}", response_model=Tool)
async def update_tool(tool_id: str, data: ToolCreate, user=Depends(get_current_user)):
    existing = await db.tools.find_one({"id": tool_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    update_data = data.model_dump()
    await db.tools.update_one({"id": tool_id}, {"$set": update_data})
    updated = await db.tools.find_one({"id": tool_id}, {"_id": 0})
    return updated

@api_router.delete("/tools/{tool_id}")
async def delete_tool(tool_id: str, user=Depends(get_current_user)):
    result = await db.tools.delete_one({"id": tool_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tool not found")
    return {"message": "Tool deleted"}

# ==================== VEHICLES ROUTES ====================
@api_router.get("/vehicles", response_model=List[Vehicle])
async def get_vehicles(user=Depends(get_current_user)):
    items = await db.vehicles.find({}, {"_id": 0}).to_list(1000)
    return items

@api_router.post("/vehicles", response_model=Vehicle)
async def create_vehicle(data: VehicleCreate, user=Depends(get_current_user)):
    vehicle = Vehicle(**data.model_dump())
    doc = vehicle.model_dump()
    await db.vehicles.insert_one(doc)
    return vehicle

@api_router.put("/vehicles/{vehicle_id}", response_model=Vehicle)
async def update_vehicle(vehicle_id: str, data: VehicleCreate, user=Depends(get_current_user)):
    existing = await db.vehicles.find_one({"id": vehicle_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    update_data = data.model_dump()
    await db.vehicles.update_one({"id": vehicle_id}, {"$set": update_data})
    updated = await db.vehicles.find_one({"id": vehicle_id}, {"_id": 0})
    return updated

@api_router.delete("/vehicles/{vehicle_id}")
async def delete_vehicle(vehicle_id: str, user=Depends(get_current_user)):
    result = await db.vehicles.delete_one({"id": vehicle_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return {"message": "Vehicle deleted"}

# ==================== MATERIALS ROUTES ====================
@api_router.get("/materials", response_model=List[Material])
async def get_materials(user=Depends(get_current_user)):
    items = await db.materials.find({}, {"_id": 0}).to_list(1000)
    return items

@api_router.post("/materials", response_model=Material)
async def create_material(data: MaterialCreate, user=Depends(get_current_user)):
    material = Material(**data.model_dump())
    doc = material.model_dump()
    await db.materials.insert_one(doc)
    return material

@api_router.put("/materials/{material_id}", response_model=Material)
async def update_material(material_id: str, data: MaterialCreate, user=Depends(get_current_user)):
    existing = await db.materials.find_one({"id": material_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Material not found")
    
    update_data = data.model_dump()
    await db.materials.update_one({"id": material_id}, {"$set": update_data})
    updated = await db.materials.find_one({"id": material_id}, {"_id": 0})
    return updated

@api_router.delete("/materials/{material_id}")
async def delete_material(material_id: str, user=Depends(get_current_user)):
    result = await db.materials.delete_one({"id": material_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Material not found")
    return {"message": "Material deleted"}

# ==================== OBRAS ROUTES ====================
@api_router.get("/obras", response_model=List[Obra])
async def get_obras(user=Depends(get_current_user)):
    items = await db.obras.find({}, {"_id": 0}).to_list(1000)
    return items

@api_router.post("/obras", response_model=Obra)
async def create_obra(data: ObraCreate, user=Depends(get_current_user)):
    obra = Obra(**data.model_dump())
    doc = obra.model_dump()
    await db.obras.insert_one(doc)
    return obra

@api_router.put("/obras/{obra_id}", response_model=Obra)
async def update_obra(obra_id: str, data: ObraCreate, user=Depends(get_current_user)):
    existing = await db.obras.find_one({"id": obra_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Obra not found")
    
    update_data = data.model_dump()
    await db.obras.update_one({"id": obra_id}, {"$set": update_data})
    updated = await db.obras.find_one({"id": obra_id}, {"_id": 0})
    return updated

@api_router.delete("/obras/{obra_id}")
async def delete_obra(obra_id: str, user=Depends(get_current_user)):
    result = await db.obras.delete_one({"id": obra_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Obra not found")
    # Unassign all resources from this obra
    await db.machines.update_many({"obra_id": obra_id}, {"$set": {"obra_id": None, "status": "available"}})
    await db.equipment.update_many({"obra_id": obra_id}, {"$set": {"obra_id": None, "status": "available"}})
    await db.tools.update_many({"obra_id": obra_id}, {"$set": {"obra_id": None, "status": "available"}})
    await db.vehicles.update_many({"obra_id": obra_id}, {"$set": {"obra_id": None, "status": "available"}})
    await db.materials.update_many({"obra_id": obra_id}, {"$set": {"obra_id": None, "status": "available"}})
    return {"message": "Obra deleted"}

@api_router.get("/obras/{obra_id}/resources")
async def get_obra_resources(obra_id: str, user=Depends(get_current_user)):
    obra = await db.obras.find_one({"id": obra_id}, {"_id": 0})
    if not obra:
        raise HTTPException(status_code=404, detail="Obra not found")
    
    machines = await db.machines.find({"obra_id": obra_id}, {"_id": 0}).to_list(1000)
    equipment = await db.equipment.find({"obra_id": obra_id}, {"_id": 0}).to_list(1000)
    tools = await db.tools.find({"obra_id": obra_id}, {"_id": 0}).to_list(1000)
    vehicles = await db.vehicles.find({"obra_id": obra_id}, {"_id": 0}).to_list(1000)
    materials = await db.materials.find({"obra_id": obra_id}, {"_id": 0}).to_list(1000)
    
    return {
        "obra": obra,
        "machines": machines,
        "equipment": equipment,
        "tools": tools,
        "vehicles": vehicles,
        "materials": materials
    }

# ==================== ASSIGNMENTS ROUTES ====================
@api_router.post("/assignments")
async def assign_resource(data: AssignmentCreate, user=Depends(get_current_user)):
    obra = await db.obras.find_one({"id": data.obra_id}, {"_id": 0})
    if not obra:
        raise HTTPException(status_code=404, detail="Obra not found")
    
    collection_map = {
        "machine": db.machines,
        "equipment": db.equipment,
        "tool": db.tools,
        "vehicle": db.vehicles,
        "material": db.materials
    }
    
    collection = collection_map.get(data.resource_type)
    if collection is None:
        raise HTTPException(status_code=400, detail="Invalid resource type")
    
    resource = await collection.find_one({"id": data.resource_id}, {"_id": 0})
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    await collection.update_one(
        {"id": data.resource_id},
        {"$set": {"obra_id": data.obra_id, "status": "in_use"}}
    )
    
    return {"message": "Resource assigned successfully"}

@api_router.post("/assignments/unassign")
async def unassign_resource(data: AssignmentCreate, user=Depends(get_current_user)):
    collection_map = {
        "machine": db.machines,
        "equipment": db.equipment,
        "tool": db.tools,
        "vehicle": db.vehicles,
        "material": db.materials
    }
    
    collection = collection_map.get(data.resource_type)
    if not collection:
        raise HTTPException(status_code=400, detail="Invalid resource type")
    
    await collection.update_one(
        {"id": data.resource_id},
        {"$set": {"obra_id": None, "status": "available"}}
    )
    
    return {"message": "Resource unassigned successfully"}

# ==================== SUMMARY ROUTES ====================
@api_router.get("/summary")
async def get_summary(user=Depends(get_current_user)):
    machines = await db.machines.find({}, {"_id": 0}).to_list(1000)
    equipment = await db.equipment.find({}, {"_id": 0}).to_list(1000)
    tools = await db.tools.find({}, {"_id": 0}).to_list(1000)
    vehicles = await db.vehicles.find({}, {"_id": 0}).to_list(1000)
    materials = await db.materials.find({}, {"_id": 0}).to_list(1000)
    obras = await db.obras.find({}, {"_id": 0}).to_list(1000)
    
    def count_by_status(items):
        return {
            "total": len(items),
            "available": len([i for i in items if i.get("status") == "available"]),
            "in_use": len([i for i in items if i.get("status") == "in_use"]),
            "maintenance": len([i for i in items if i.get("status") == "maintenance"]),
            "broken": len([i for i in items if i.get("status") == "broken"])
        }
    
    # Maintenance alerts
    today = datetime.now(timezone.utc).date()
    alerts = []
    
    for m in machines:
        if m.get("next_maintenance"):
            try:
                maint_date = datetime.fromisoformat(m["next_maintenance"].replace("Z", "+00:00")).date()
                days_until = (maint_date - today).days
                if days_until <= 7:
                    alerts.append({
                        "type": "machine",
                        "name": m["name"],
                        "message": f"Manutenção em {days_until} dias" if days_until >= 0 else "Manutenção atrasada",
                        "urgent": days_until < 0
                    })
            except:
                pass
    
    for v in vehicles:
        if v.get("next_maintenance"):
            try:
                maint_date = datetime.fromisoformat(v["next_maintenance"].replace("Z", "+00:00")).date()
                days_until = (maint_date - today).days
                if days_until <= 7:
                    alerts.append({
                        "type": "vehicle",
                        "name": v["name"],
                        "plate": v.get("plate", ""),
                        "message": f"Manutenção em {days_until} dias" if days_until >= 0 else "Manutenção atrasada",
                        "urgent": days_until < 0
                    })
            except:
                pass
    
    return {
        "machines": count_by_status(machines),
        "equipment": count_by_status(equipment),
        "tools": count_by_status(tools),
        "vehicles": count_by_status(vehicles),
        "materials": {"total": len(materials), "total_quantity": sum(m.get("quantity", 0) for m in materials)},
        "obras": {
            "total": len(obras),
            "active": len([o for o in obras if o.get("status") == "active"]),
            "completed": len([o for o in obras if o.get("status") == "completed"]),
            "paused": len([o for o in obras if o.get("status") == "paused"])
        },
        "alerts": alerts
    }

# ==================== EXPORT ROUTES ====================
@api_router.get("/export/pdf")
async def export_pdf(user=Depends(get_current_user)):
    machines = await db.machines.find({}, {"_id": 0}).to_list(1000)
    equipment = await db.equipment.find({}, {"_id": 0}).to_list(1000)
    tools = await db.tools.find({}, {"_id": 0}).to_list(1000)
    vehicles = await db.vehicles.find({}, {"_id": 0}).to_list(1000)
    materials = await db.materials.find({}, {"_id": 0}).to_list(1000)
    obras = await db.obras.find({}, {"_id": 0}).to_list(1000)
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []
    
    elements.append(Paragraph("Relatório de Armazém - Construção Civil", styles['Title']))
    elements.append(Paragraph(f"Data: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
    elements.append(Spacer(1, 20))
    
    # Summary table
    summary_data = [
        ["Categoria", "Total", "Disponível", "Em Uso", "Manutenção"],
        ["Máquinas", len(machines), len([i for i in machines if i.get("status") == "available"]), 
         len([i for i in machines if i.get("status") == "in_use"]), len([i for i in machines if i.get("status") == "maintenance"])],
        ["Equipamentos", len(equipment), len([i for i in equipment if i.get("status") == "available"]), 
         len([i for i in equipment if i.get("status") == "in_use"]), len([i for i in equipment if i.get("status") == "maintenance"])],
        ["Ferramentas", len(tools), len([i for i in tools if i.get("status") == "available"]), 
         len([i for i in tools if i.get("status") == "in_use"]), len([i for i in tools if i.get("status") == "maintenance"])],
        ["Viaturas", len(vehicles), len([i for i in vehicles if i.get("status") == "available"]), 
         len([i for i in vehicles if i.get("status") == "in_use"]), len([i for i in vehicles if i.get("status") == "maintenance"])],
        ["Materiais", len(materials), "-", "-", "-"],
        ["Obras", len(obras), len([o for o in obras if o.get("status") == "active"]), 
         len([o for o in obras if o.get("status") == "completed"]), len([o for o in obras if o.get("status") == "paused"])]
    ]
    
    table = Table(summary_data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    elements.append(table)
    
    doc.build(elements)
    buffer.seek(0)
    
    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=relatorio_armazem.pdf"}
    )

@api_router.get("/export/excel")
async def export_excel(user=Depends(get_current_user)):
    machines = await db.machines.find({}, {"_id": 0}).to_list(1000)
    equipment = await db.equipment.find({}, {"_id": 0}).to_list(1000)
    tools = await db.tools.find({}, {"_id": 0}).to_list(1000)
    vehicles = await db.vehicles.find({}, {"_id": 0}).to_list(1000)
    materials = await db.materials.find({}, {"_id": 0}).to_list(1000)
    obras = await db.obras.find({}, {"_id": 0}).to_list(1000)
    
    wb = Workbook()
    
    # Machines sheet
    ws = wb.active
    ws.title = "Máquinas"
    ws.append(["Nome", "Quantidade", "Localização", "Estado", "Próxima Manutenção"])
    for m in machines:
        ws.append([m.get("name", ""), m.get("quantity", 0), m.get("location", ""), m.get("status", ""), m.get("next_maintenance", "")])
    
    # Equipment sheet
    ws = wb.create_sheet("Equipamentos")
    ws.append(["Nome", "Quantidade", "Localização", "Estado"])
    for e in equipment:
        ws.append([e.get("name", ""), e.get("quantity", 0), e.get("location", ""), e.get("status", "")])
    
    # Tools sheet
    ws = wb.create_sheet("Ferramentas")
    ws.append(["Nome", "Quantidade", "Localização", "Estado"])
    for t in tools:
        ws.append([t.get("name", ""), t.get("quantity", 0), t.get("location", ""), t.get("status", "")])
    
    # Vehicles sheet
    ws = wb.create_sheet("Viaturas")
    ws.append(["Nome", "Matrícula", "Quantidade", "Localização", "Estado", "Próxima Manutenção"])
    for v in vehicles:
        ws.append([v.get("name", ""), v.get("plate", ""), v.get("quantity", 0), v.get("location", ""), v.get("status", ""), v.get("next_maintenance", "")])
    
    # Materials sheet
    ws = wb.create_sheet("Materiais")
    ws.append(["Nome", "Quantidade", "Unidade", "Localização", "Estado"])
    for m in materials:
        ws.append([m.get("name", ""), m.get("quantity", 0), m.get("unit", ""), m.get("location", ""), m.get("status", "")])
    
    # Obras sheet
    ws = wb.create_sheet("Obras")
    ws.append(["Nome", "Endereço", "Cliente", "Estado"])
    for o in obras:
        ws.append([o.get("name", ""), o.get("address", ""), o.get("client_name", ""), o.get("status", "")])
    
    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    
    return Response(
        content=buffer.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=relatorio_armazem.xlsx"}
    )

# ==================== ROOT ====================
@api_router.get("/")
async def root():
    return {"message": "Warehouse Management API"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
