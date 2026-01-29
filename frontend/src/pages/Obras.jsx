import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Building2, Eye, Search } from "lucide-react";
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

const estadoOptions = ["Ativa", "Concluida", "Pausada"];
const estadoLabels = { Ativa: "Ativa", Concluida: "Concluída", Pausada: "Pausada" };

export default function Obras() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    codigo: "",
    nome: "",
    endereco: "",
    cliente: "",
    estado: "Ativa"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API}/obras`, { headers: { Authorization: `Bearer ${token}` } });
      setObras(response.data);
    } catch (error) {
      toast.error("Erro ao carregar obras");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedItem) {
        await axios.put(`${API}/obras/${selectedItem.id}`, formData, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Obra atualizada");
      } else {
        await axios.post(`${API}/obras`, formData, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Obra criada");
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
      await axios.delete(`${API}/obras/${selectedItem.id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Obra eliminada");
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
      nome: item.nome,
      endereco: item.endereco || "",
      cliente: item.cliente || "",
      estado: item.estado || "Ativa"
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setSelectedItem(null);
    setFormData({ codigo: "", nome: "", endereco: "", cliente: "", estado: "Ativa" });
  };

  const filtered = obras.filter(o => 
    o.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.cliente?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-neutral-400">A carregar...</div></div>;

  return (
    <div data-testid="obras-page">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Building2 className="h-7 w-7 text-orange-500" />
            Obras
          </h1>
          <p className="text-neutral-400 text-sm mt-1">Gestão de obras e projetos</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="bg-orange-500 hover:bg-orange-600 text-black font-semibold" data-testid="add-obra-btn">
          <Plus className="h-4 w-4 mr-2" /> Nova Obra
        </Button>
      </div>

      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
        <Input placeholder="Pesquisar por código, nome ou cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-neutral-800 border border-neutral-700 rounded-lg">
          <Building2 className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
          <p className="text-neutral-400">{searchTerm ? "Nenhum resultado" : "Nenhuma obra registada"}</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-neutral-800 border border-neutral-700 rounded-lg">
          <table className="w-full" data-testid="obras-table">
            <thead>
              <tr className="border-b border-neutral-700">
                <th className="text-left py-3 px-4 text-neutral-400 font-medium text-sm">Código</th>
                <th className="text-left py-3 px-4 text-neutral-400 font-medium text-sm">Nome</th>
                <th className="text-left py-3 px-4 text-neutral-400 font-medium text-sm">Endereço</th>
                <th className="text-left py-3 px-4 text-neutral-400 font-medium text-sm">Cliente</th>
                <th className="text-left py-3 px-4 text-neutral-400 font-medium text-sm">Estado</th>
                <th className="text-right py-3 px-4 text-neutral-400 font-medium text-sm">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-neutral-700/50 hover:bg-neutral-700/30" data-testid={`obra-row-${item.id}`}>
                  <td className="py-3 px-4 font-mono text-orange-400">{item.codigo}</td>
                  <td className="py-3 px-4 text-white">{item.nome}</td>
                  <td className="py-3 px-4 text-neutral-400">{item.endereco || "-"}</td>
                  <td className="py-3 px-4 text-neutral-400">{item.cliente || "-"}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${item.estado === "Ativa" ? "bg-emerald-500/20 text-emerald-400" : item.estado === "Pausada" ? "bg-amber-500/20 text-amber-400" : "bg-neutral-500/20 text-neutral-400"}`}>
                      {estadoLabels[item.estado] || item.estado}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/obras/${item.id}`)} className="text-neutral-400 hover:text-white" data-testid={`view-${item.id}`}><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)} className="text-neutral-400 hover:text-white"><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedItem(item); setDeleteDialogOpen(true); }} className="text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-neutral-900 border-neutral-700">
          <DialogHeader>
            <DialogTitle className="text-white">{selectedItem ? "Editar Obra" : "Nova Obra"}</DialogTitle>
            <DialogDescription className="text-neutral-400">Preencha os dados da obra</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label className="text-neutral-300">Código *</Label>
                <Input value={formData.codigo} onChange={(e) => setFormData({...formData, codigo: e.target.value})} required className="bg-neutral-800 border-neutral-700 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-300">Nome *</Label>
                <Input value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} required className="bg-neutral-800 border-neutral-700 text-white" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-neutral-300">Endereço</Label>
                <Input value={formData.endereco} onChange={(e) => setFormData({...formData, endereco: e.target.value})} className="bg-neutral-800 border-neutral-700 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-300">Cliente</Label>
                <Input value={formData.cliente} onChange={(e) => setFormData({...formData, cliente: e.target.value})} className="bg-neutral-800 border-neutral-700 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-300">Estado</Label>
                <Select value={formData.estado} onValueChange={(v) => setFormData({...formData, estado: v})}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    {estadoOptions.map(e => <SelectItem key={e} value={e} className="text-white hover:bg-neutral-700">{estadoLabels[e]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-neutral-600 text-neutral-300 hover:bg-neutral-800">Cancelar</Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-black font-semibold">{selectedItem ? "Guardar" : "Criar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-neutral-900 border-neutral-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Eliminar Obra</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">Tem a certeza que deseja eliminar "{selectedItem?.nome}"?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-neutral-600 text-neutral-300 hover:bg-neutral-800">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
