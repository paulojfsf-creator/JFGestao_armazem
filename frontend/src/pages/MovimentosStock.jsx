import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Plus, Package } from "lucide-react";
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

const tipoMovOptions = ["Entrada", "Saida"];

export default function MovimentosStock() {
  const { token } = useAuth();
  const [movimentos, setMovimentos] = useState([]);
  const [materiais, setMateriais] = useState([]);
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    material_id: "",
    tipo_movimento: "Entrada",
    quantidade: 0,
    obra_id: "",
    fornecedor: "",
    documento: "",
    responsavel: "",
    observacoes: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [movRes, matRes, obrasRes] = await Promise.all([
        axios.get(`${API}/movimentos/stock`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/materiais`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/obras`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setMovimentos(movRes.data);
      setMateriais(matRes.data);
      setObras(obrasRes.data);
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        obra_id: formData.obra_id || null,
        quantidade: parseFloat(formData.quantidade) || 0
      };
      await axios.post(`${API}/movimentos/stock`, payload, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Movimento registado e stock atualizado");
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error("Erro ao registar movimento");
    }
  };

  const resetForm = () => {
    setFormData({
      material_id: "", tipo_movimento: "Entrada", quantidade: 0,
      obra_id: "", fornecedor: "", documento: "", responsavel: "", observacoes: ""
    });
  };

  const getMaterialName = (id) => {
    const mat = materiais.find(m => m.id === id);
    return mat ? `${mat.codigo} - ${mat.descricao}` : id;
  };
  const getObraName = (id) => obras.find(o => o.id === id)?.nome || "-";

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-slate-500">A carregar...</div></div>;

  return (
    <div data-testid="movimentos-stock-page">
      <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Package className="h-8 w-8 text-amber-500" />
            Movimentos de Stock
          </h1>
          <p className="page-subtitle">Registo de entradas e saídas de materiais</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="btn-primary" data-testid="add-mov-btn">
          <Plus className="h-4 w-4 mr-2" /> Novo Movimento
        </Button>
      </div>

      {movimentos.length === 0 ? (
        <div className="text-center py-12 bg-white border border-slate-200 rounded-sm">
          <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Nenhum movimento registado</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table" data-testid="movimentos-table">
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Tipo</th>
                <th>Material</th>
                <th>Quantidade</th>
                <th>Obra</th>
                <th>Fornecedor</th>
                <th>Responsável</th>
              </tr>
            </thead>
            <tbody>
              {movimentos.map((mov) => (
                <tr key={mov.id}>
                  <td className="text-sm">{new Date(mov.data_hora).toLocaleString("pt-PT")}</td>
                  <td>
                    <span className={`badge ${mov.tipo_movimento === "Entrada" ? "status-available" : "status-in_use"}`}>
                      {mov.tipo_movimento}
                    </span>
                  </td>
                  <td>{getMaterialName(mov.material_id)}</td>
                  <td className={mov.tipo_movimento === "Entrada" ? "text-emerald-600" : "text-red-600"}>
                    {mov.tipo_movimento === "Entrada" ? "+" : "-"}{mov.quantidade}
                  </td>
                  <td className="text-slate-500">{getObraName(mov.obra_id)}</td>
                  <td className="text-slate-500">{mov.fornecedor || "-"}</td>
                  <td className="text-slate-500">{mov.responsavel || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Movimento de Stock</DialogTitle>
            <DialogDescription>Registe uma entrada ou saída de material</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>Tipo Movimento *</Label>
                <Select value={formData.tipo_movimento} onValueChange={(v) => setFormData({...formData, tipo_movimento: v})}>
                  <SelectTrigger className="rounded-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {tipoMovOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Material *</Label>
                <Select value={formData.material_id} onValueChange={(v) => setFormData({...formData, material_id: v})}>
                  <SelectTrigger className="rounded-sm"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {materiais.map(m => <SelectItem key={m.id} value={m.id}>{m.codigo} - {m.descricao}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantidade *</Label>
                <Input type="number" step="0.01" min="0" value={formData.quantidade} onChange={(e) => setFormData({...formData, quantidade: e.target.value})} required className="rounded-sm" />
              </div>
              <div className="space-y-2">
                <Label>Obra</Label>
                <Select value={formData.obra_id} onValueChange={(v) => setFormData({...formData, obra_id: v})}>
                  <SelectTrigger className="rounded-sm"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
                    {obras.map(o => <SelectItem key={o.id} value={o.id}>{o.codigo} - {o.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <Input value={formData.fornecedor} onChange={(e) => setFormData({...formData, fornecedor: e.target.value})} className="rounded-sm" />
              </div>
              <div className="space-y-2">
                <Label>Documento</Label>
                <Input value={formData.documento} onChange={(e) => setFormData({...formData, documento: e.target.value})} placeholder="Nº Fatura, Guia, etc." className="rounded-sm" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Responsável</Label>
                <Input value={formData.responsavel} onChange={(e) => setFormData({...formData, responsavel: e.target.value})} className="rounded-sm" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Observações</Label>
                <Textarea value={formData.observacoes} onChange={(e) => setFormData({...formData, observacoes: e.target.value})} rows={2} className="rounded-sm" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-sm">Cancelar</Button>
              <Button type="submit" className="btn-primary" disabled={!formData.material_id || !formData.quantidade}>Registar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
