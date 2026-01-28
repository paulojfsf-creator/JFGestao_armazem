import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Truck, Search, Calendar, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

const combustivelOptions = ["Gasoleo", "Gasolina", "Eletrico", "Hibrido"];

export default function Viaturas() {
  const { token } = useAuth();
  const [viaturas, setViaturas] = useState([]);
  const [locais, setLocais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingAlerts, setSendingAlerts] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    matricula: "",
    marca: "",
    modelo: "",
    combustivel: "Gasoleo",
    ativa: true,
    foto: "",
    data_vistoria: "",
    data_seguro: "",
    documento_unico: "",
    apolice_seguro: "",
    observacoes: "",
    local_id: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vRes, locRes] = await Promise.all([
        axios.get(`${API}/viaturas`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/locais`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setViaturas(vRes.data);
      setLocais(locRes.data);
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleSendAlerts = async () => {
    setSendingAlerts(true);
    try {
      const response = await axios.post(`${API}/alerts/send`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(response.data.message);
    } catch (error) {
      toast.error("Erro ao enviar alertas");
    } finally {
      setSendingAlerts(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, local_id: formData.local_id || null };
      if (selectedItem) {
        await axios.put(`${API}/viaturas/${selectedItem.id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Viatura atualizada");
      } else {
        await axios.post(`${API}/viaturas`, payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Viatura criada");
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
      await axios.delete(`${API}/viaturas/${selectedItem.id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Viatura eliminada");
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
      matricula: item.matricula,
      marca: item.marca || "",
      modelo: item.modelo || "",
      combustivel: item.combustivel || "Gasoleo",
      ativa: item.ativa ?? true,
      foto: item.foto || "",
      data_vistoria: item.data_vistoria?.split("T")[0] || "",
      data_seguro: item.data_seguro?.split("T")[0] || "",
      documento_unico: item.documento_unico || "",
      apolice_seguro: item.apolice_seguro || "",
      observacoes: item.observacoes || "",
      local_id: item.local_id || ""
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setSelectedItem(null);
    setFormData({
      matricula: "", marca: "", modelo: "", combustivel: "Gasoleo", ativa: true,
      foto: "", data_vistoria: "", data_seguro: "", documento_unico: "",
      apolice_seguro: "", observacoes: "", local_id: ""
    });
  };

  const filtered = viaturas.filter(v => 
    v.matricula?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.modelo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-slate-500">A carregar...</div></div>;

  return (
    <div data-testid="viaturas-page">
      <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Truck className="h-8 w-8 text-amber-500" />
            Viaturas
          </h1>
          <p className="page-subtitle">Gestão de viaturas e veículos</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSendAlerts} disabled={sendingAlerts} variant="outline" className="rounded-sm" data-testid="send-alerts-btn">
            <Mail className="h-4 w-4 mr-2" />
            {sendingAlerts ? "A enviar..." : "Enviar Alertas"}
          </Button>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="btn-primary" data-testid="add-viatura-btn">
            <Plus className="h-4 w-4 mr-2" /> Nova Viatura
          </Button>
        </div>
      </div>

      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input placeholder="Pesquisar por matrícula, marca ou modelo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 rounded-sm" data-testid="search-input" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white border border-slate-200 rounded-sm">
          <Truck className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">{searchTerm ? "Nenhum resultado" : "Nenhuma viatura registada"}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table" data-testid="viaturas-table">
            <thead>
              <tr>
                <th>Matrícula</th>
                <th>Marca/Modelo</th>
                <th>Combustível</th>
                <th>Data Vistoria</th>
                <th>Data Seguro</th>
                <th>Ativa</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} data-testid={`viatura-row-${item.id}`}>
                  <td className="font-mono font-medium">{item.matricula}</td>
                  <td>{item.marca} {item.modelo}</td>
                  <td className="text-slate-500">{item.combustivel}</td>
                  <td>
                    {item.data_vistoria ? (
                      <span className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(item.data_vistoria).toLocaleDateString("pt-PT")}
                      </span>
                    ) : "-"}
                  </td>
                  <td>
                    {item.data_seguro ? (
                      <span className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(item.data_seguro).toLocaleDateString("pt-PT")}
                      </span>
                    ) : "-"}
                  </td>
                  <td><span className={`h-2 w-2 rounded-full inline-block ${item.ativa ? "bg-emerald-500" : "bg-slate-300"}`} /></td>
                  <td className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedItem(item); setDeleteDialogOpen(true); }} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedItem ? "Editar Viatura" : "Nova Viatura"}</DialogTitle>
            <DialogDescription>Preencha os dados da viatura</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>Matrícula *</Label>
                <Input value={formData.matricula} onChange={(e) => setFormData({...formData, matricula: e.target.value})} required placeholder="XX-XX-XX" data-testid="matricula-input" className="rounded-sm" />
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
                <Label>Combustível</Label>
                <Select value={formData.combustivel} onValueChange={(v) => setFormData({...formData, combustivel: v})}>
                  <SelectTrigger className="rounded-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {combustivelOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data Vistoria</Label>
                <Input type="date" value={formData.data_vistoria} onChange={(e) => setFormData({...formData, data_vistoria: e.target.value})} className="rounded-sm" />
              </div>
              <div className="space-y-2">
                <Label>Data Seguro</Label>
                <Input type="date" value={formData.data_seguro} onChange={(e) => setFormData({...formData, data_seguro: e.target.value})} className="rounded-sm" />
              </div>
              <div className="space-y-2">
                <Label>Documento Único</Label>
                <Input value={formData.documento_unico} onChange={(e) => setFormData({...formData, documento_unico: e.target.value})} className="rounded-sm" />
              </div>
              <div className="space-y-2">
                <Label>Apólice Seguro</Label>
                <Input value={formData.apolice_seguro} onChange={(e) => setFormData({...formData, apolice_seguro: e.target.value})} className="rounded-sm" />
              </div>
              <div className="space-y-2">
                <Label>Local</Label>
                <Select value={formData.local_id || "none"} onValueChange={(v) => setFormData({...formData, local_id: v === "none" ? "" : v})}>
                  <SelectTrigger className="rounded-sm"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {locais.map(l => <SelectItem key={l.id} value={l.id}>{l.codigo} - {l.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>URL Foto</Label>
                <Input value={formData.foto} onChange={(e) => setFormData({...formData, foto: e.target.value})} placeholder="https://..." className="rounded-sm" />
              </div>
              <div className="md:col-span-2">
                <ImageUpload 
                  value={formData.foto} 
                  onChange={(url) => setFormData({...formData, foto: url})}
                  label="Ou carregar foto"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Observações</Label>
                <Textarea value={formData.observacoes} onChange={(e) => setFormData({...formData, observacoes: e.target.value})} className="rounded-sm" rows={2} />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={formData.ativa} onCheckedChange={(v) => setFormData({...formData, ativa: v})} />
                <Label>Ativa</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-sm">Cancelar</Button>
              <Button type="submit" className="btn-primary">{selectedItem ? "Guardar" : "Criar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Viatura</AlertDialogTitle>
            <AlertDialogDescription>Tem a certeza que deseja eliminar "{selectedItem?.matricula}"?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="btn-danger">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
