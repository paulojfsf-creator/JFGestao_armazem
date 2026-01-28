import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Wrench, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import ImageUpload from "@/components/ImageUpload";

const estadoOptions = ["Bom", "Razoável", "Mau"];

export default function Equipamentos() {
  const { token } = useAuth();
  const [equipamentos, setEquipamentos] = useState([]);
  const [locais, setLocais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    codigo: "",
    descricao: "",
    marca: "",
    modelo: "",
    data_aquisicao: "",
    ativo: true,
    categoria: "",
    numero_serie: "",
    responsavel: "",
    estado_conservacao: "Bom",
    foto: "",
    local_id: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eqRes, locRes] = await Promise.all([
        axios.get(`${API}/equipamentos`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/locais`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setEquipamentos(eqRes.data);
      setLocais(locRes.data);
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, local_id: formData.local_id || null };
      if (selectedItem) {
        await axios.put(`${API}/equipamentos/${selectedItem.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Equipamento atualizado");
      } else {
        await axios.post(`${API}/equipamentos`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Equipamento criado");
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao guardar");
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/equipamentos/${selectedItem.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Equipamento eliminado");
      setDeleteDialogOpen(false);
      setSelectedItem(null);
      fetchData();
    } catch (error) {
      toast.error("Erro ao eliminar");
    }
  };

  const openEditDialog = (item) => {
    setSelectedItem(item);
    setFormData({
      codigo: item.codigo,
      descricao: item.descricao,
      marca: item.marca || "",
      modelo: item.modelo || "",
      data_aquisicao: item.data_aquisicao?.split("T")[0] || "",
      ativo: item.ativo ?? true,
      categoria: item.categoria || "",
      numero_serie: item.numero_serie || "",
      responsavel: item.responsavel || "",
      estado_conservacao: item.estado_conservacao || "Bom",
      foto: item.foto || "",
      local_id: item.local_id || ""
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setSelectedItem(null);
    setFormData({
      codigo: "", descricao: "", marca: "", modelo: "", data_aquisicao: "",
      ativo: true, categoria: "", numero_serie: "", responsavel: "",
      estado_conservacao: "Bom", foto: "", local_id: ""
    });
  };

  const filtered = equipamentos.filter(e => 
    e.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.marca?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLocalName = (localId) => {
    const local = locais.find(l => l.id === localId);
    return local ? `${local.codigo} - ${local.nome}` : "-";
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-slate-500">A carregar...</div></div>;

  return (
    <div data-testid="equipamentos-page">
      <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Wrench className="h-8 w-8 text-amber-500" />
            Equipamentos
          </h1>
          <p className="page-subtitle">Gestão de equipamentos do armazém</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="btn-primary" data-testid="add-equipamento-btn">
          <Plus className="h-4 w-4 mr-2" /> Novo Equipamento
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Pesquisar por código, descrição ou marca..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 rounded-sm"
          data-testid="search-input"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white border border-slate-200 rounded-sm">
          <Wrench className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">{searchTerm ? "Nenhum resultado encontrado" : "Nenhum equipamento registado"}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table" data-testid="equipamentos-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Descrição</th>
                <th>Marca/Modelo</th>
                <th>Categoria</th>
                <th>Estado</th>
                <th>Local</th>
                <th>Ativo</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} data-testid={`equipamento-row-${item.id}`}>
                  <td className="font-mono text-sm font-medium">{item.codigo}</td>
                  <td>{item.descricao}</td>
                  <td className="text-slate-500">{item.marca} {item.modelo}</td>
                  <td className="text-slate-500">{item.categoria || "-"}</td>
                  <td>
                    <span className={`badge ${item.estado_conservacao === "Bom" ? "status-available" : item.estado_conservacao === "Razoável" ? "status-maintenance" : "status-broken"}`}>
                      {item.estado_conservacao}
                    </span>
                  </td>
                  <td className="text-slate-500 text-sm">{getLocalName(item.local_id)}</td>
                  <td>
                    <span className={`h-2 w-2 rounded-full inline-block ${item.ativo ? "bg-emerald-500" : "bg-slate-300"}`} />
                  </td>
                  <td className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)} data-testid={`edit-${item.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedItem(item); setDeleteDialogOpen(true); }} className="text-red-500" data-testid={`delete-${item.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedItem ? "Editar Equipamento" : "Novo Equipamento"}</DialogTitle>
            <DialogDescription>Preencha os dados do equipamento</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>Código *</Label>
                <Input value={formData.codigo} onChange={(e) => setFormData({...formData, codigo: e.target.value})} required data-testid="codigo-input" className="rounded-sm" />
              </div>
              <div className="space-y-2">
                <Label>Descrição *</Label>
                <Input value={formData.descricao} onChange={(e) => setFormData({...formData, descricao: e.target.value})} required data-testid="descricao-input" className="rounded-sm" />
              </div>
              <div className="space-y-2">
                <Label>Marca</Label>
                <Input value={formData.marca} onChange={(e) => setFormData({...formData, marca: e.target.value})} data-testid="marca-input" className="rounded-sm" />
              </div>
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Input value={formData.modelo} onChange={(e) => setFormData({...formData, modelo: e.target.value})} data-testid="modelo-input" className="rounded-sm" />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input value={formData.categoria} onChange={(e) => setFormData({...formData, categoria: e.target.value})} placeholder="Ex: Aparafusadora, Aspirador" data-testid="categoria-input" className="rounded-sm" />
              </div>
              <div className="space-y-2">
                <Label>Nº Série</Label>
                <Input value={formData.numero_serie} onChange={(e) => setFormData({...formData, numero_serie: e.target.value})} data-testid="serie-input" className="rounded-sm" />
              </div>
              <div className="space-y-2">
                <Label>Data Aquisição</Label>
                <Input type="date" value={formData.data_aquisicao} onChange={(e) => setFormData({...formData, data_aquisicao: e.target.value})} data-testid="data-input" className="rounded-sm" />
              </div>
              <div className="space-y-2">
                <Label>Estado Conservação</Label>
                <Select value={formData.estado_conservacao} onValueChange={(v) => setFormData({...formData, estado_conservacao: v})}>
                  <SelectTrigger className="rounded-sm" data-testid="estado-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {estadoOptions.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Responsável</Label>
                <Input value={formData.responsavel} onChange={(e) => setFormData({...formData, responsavel: e.target.value})} data-testid="responsavel-input" className="rounded-sm" />
              </div>
              <div className="space-y-2">
                <Label>Local</Label>
                <Select value={formData.local_id} onValueChange={(v) => setFormData({...formData, local_id: v})}>
                  <SelectTrigger className="rounded-sm" data-testid="local-select"><SelectValue placeholder="Selecione um local" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {locais.map(l => <SelectItem key={l.id} value={l.id}>{l.codigo} - {l.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>URL Foto</Label>
                <Input value={formData.foto} onChange={(e) => setFormData({...formData, foto: e.target.value})} placeholder="https://..." data-testid="foto-input" className="rounded-sm" />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={formData.ativo} onCheckedChange={(v) => setFormData({...formData, ativo: v})} data-testid="ativo-switch" />
                <Label>Ativo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-sm">Cancelar</Button>
              <Button type="submit" className="btn-primary" data-testid="submit-btn">{selectedItem ? "Guardar" : "Criar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Equipamento</AlertDialogTitle>
            <AlertDialogDescription>Tem a certeza que deseja eliminar "{selectedItem?.descricao}"?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="btn-danger" data-testid="confirm-delete-btn">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
