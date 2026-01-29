import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Package, Search, AlertTriangle } from "lucide-react";
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

const unidadeOptions = ["unidade", "kg", "m", "m2", "m3", "litro", "saco", "palete"];

export default function Materiais() {
  const { token } = useAuth();
  const [materiais, setMateriais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    codigo: "",
    descricao: "",
    unidade: "unidade",
    stock_atual: 0,
    stock_minimo: 0,
    ativo: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API}/materiais`, { headers: { Authorization: `Bearer ${token}` } });
      setMateriais(response.data);
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedItem) {
        await axios.put(`${API}/materiais/${selectedItem.id}`, formData, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Material atualizado");
      } else {
        await axios.post(`${API}/materiais`, formData, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Material criado");
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
      await axios.delete(`${API}/materiais/${selectedItem.id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Material eliminado");
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
      unidade: item.unidade || "unidade",
      stock_atual: item.stock_atual || 0,
      stock_minimo: item.stock_minimo || 0,
      ativo: item.ativo ?? true
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setSelectedItem(null);
    setFormData({ codigo: "", descricao: "", unidade: "unidade", stock_atual: 0, stock_minimo: 0, ativo: true });
  };

  const filtered = materiais.filter(m => 
    m.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-neutral-400">A carregar...</div></div>;

  return (
    <div data-testid="materiais-page">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Package className="h-7 w-7 text-orange-500" />
            Materiais
          </h1>
          <p className="text-neutral-400 text-sm mt-1">Gestão de materiais e stock</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="bg-orange-500 hover:bg-orange-600 text-black font-semibold" data-testid="add-material-btn">
          <Plus className="h-4 w-4 mr-2" /> Novo Material
        </Button>
      </div>

      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
        <Input placeholder="Pesquisar por código ou descrição..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-neutral-800 border border-neutral-700 rounded-lg">
          <Package className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
          <p className="text-neutral-400">{searchTerm ? "Nenhum resultado" : "Nenhum material registado"}</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-neutral-800 border border-neutral-700 rounded-lg">
          <table className="w-full" data-testid="materiais-table">
            <thead>
              <tr className="border-b border-neutral-700">
                <th className="text-left py-3 px-4 text-neutral-400 font-medium text-sm">Código</th>
                <th className="text-left py-3 px-4 text-neutral-400 font-medium text-sm">Descrição</th>
                <th className="text-left py-3 px-4 text-neutral-400 font-medium text-sm">Unidade</th>
                <th className="text-left py-3 px-4 text-neutral-400 font-medium text-sm">Stock Atual</th>
                <th className="text-left py-3 px-4 text-neutral-400 font-medium text-sm">Stock Mínimo</th>
                <th className="text-left py-3 px-4 text-neutral-400 font-medium text-sm">Ativo</th>
                <th className="text-right py-3 px-4 text-neutral-400 font-medium text-sm">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const lowStock = item.stock_atual <= item.stock_minimo && item.stock_minimo > 0;
                return (
                  <tr key={item.id} className="border-b border-neutral-700/50 hover:bg-neutral-700/30" data-testid={`material-row-${item.id}`}>
                    <td className="py-3 px-4 font-mono text-orange-400">{item.codigo}</td>
                    <td className="py-3 px-4 text-white">{item.descricao}</td>
                    <td className="py-3 px-4 text-neutral-400">{item.unidade}</td>
                    <td className={`py-3 px-4 ${lowStock ? "text-red-400 font-medium" : "text-white"}`}>
                      {lowStock && <AlertTriangle className="h-3.5 w-3.5 inline mr-1" />}
                      {item.stock_atual}
                    </td>
                    <td className="py-3 px-4 text-neutral-400">{item.stock_minimo}</td>
                    <td className="py-3 px-4"><span className={`h-2 w-2 rounded-full inline-block ${item.ativo ? "bg-emerald-500" : "bg-neutral-500"}`} /></td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)} className="text-neutral-400 hover:text-white"><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedItem(item); setDeleteDialogOpen(true); }} className="text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-neutral-900 border-neutral-700">
          <DialogHeader>
            <DialogTitle className="text-white">{selectedItem ? "Editar Material" : "Novo Material"}</DialogTitle>
            <DialogDescription className="text-neutral-400">Preencha os dados do material</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label className="text-neutral-300">Código *</Label>
                <Input value={formData.codigo} onChange={(e) => setFormData({...formData, codigo: e.target.value})} required className="bg-neutral-800 border-neutral-700 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-300">Descrição *</Label>
                <Input value={formData.descricao} onChange={(e) => setFormData({...formData, descricao: e.target.value})} required className="bg-neutral-800 border-neutral-700 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-300">Unidade</Label>
                <Select value={formData.unidade} onValueChange={(v) => setFormData({...formData, unidade: v})}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    {unidadeOptions.map(u => <SelectItem key={u} value={u} className="text-white hover:bg-neutral-700">{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-300">Stock Atual</Label>
                <Input type="number" step="0.01" value={formData.stock_atual} onChange={(e) => setFormData({...formData, stock_atual: parseFloat(e.target.value) || 0})} className="bg-neutral-800 border-neutral-700 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-300">Stock Mínimo</Label>
                <Input type="number" step="0.01" value={formData.stock_minimo} onChange={(e) => setFormData({...formData, stock_minimo: parseFloat(e.target.value) || 0})} className="bg-neutral-800 border-neutral-700 text-white" />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={formData.ativo} onCheckedChange={(v) => setFormData({...formData, ativo: v})} />
                <Label className="text-neutral-300">Ativo</Label>
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
            <AlertDialogTitle className="text-white">Eliminar Material</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">Tem a certeza que deseja eliminar "{selectedItem?.descricao}"?</AlertDialogDescription>
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
