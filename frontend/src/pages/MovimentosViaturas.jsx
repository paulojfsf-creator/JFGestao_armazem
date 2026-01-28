import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Plus, Truck } from "lucide-react";
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

export default function MovimentosViaturas() {
  const { token } = useAuth();
  const [movimentos, setMovimentos] = useState([]);
  const [viaturas, setViaturas] = useState([]);
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    viatura_id: "",
    obra_id: "",
    condutor: "",
    km_inicial: 0,
    km_final: 0,
    data: "",
    observacoes: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [movRes, viatRes, obrasRes] = await Promise.all([
        axios.get(`${API}/movimentos/viaturas`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/viaturas`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/obras`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setMovimentos(movRes.data);
      setViaturas(viatRes.data);
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
        km_inicial: parseFloat(formData.km_inicial) || 0,
        km_final: parseFloat(formData.km_final) || 0
      };
      await axios.post(`${API}/movimentos/viaturas`, payload, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Movimento registado");
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error("Erro ao registar movimento");
    }
  };

  const resetForm = () => {
    setFormData({
      viatura_id: "", obra_id: "", condutor: "", km_inicial: 0, km_final: 0, data: "", observacoes: ""
    });
  };

  const getViaturaName = (id) => {
    const v = viaturas.find(v => v.id === id);
    return v ? `${v.matricula} - ${v.marca} ${v.modelo}` : id;
  };
  const getObraName = (id) => obras.find(o => o.id === id)?.nome || "-";

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-slate-500">A carregar...</div></div>;

  return (
    <div data-testid="movimentos-viaturas-page">
      <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Truck className="h-8 w-8 text-amber-500" />
            Movimentos de Viaturas
          </h1>
          <p className="page-subtitle">Registo de utilização de viaturas</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="btn-primary" data-testid="add-mov-btn">
          <Plus className="h-4 w-4 mr-2" /> Novo Movimento
        </Button>
      </div>

      {movimentos.length === 0 ? (
        <div className="text-center py-12 bg-white border border-slate-200 rounded-sm">
          <Truck className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Nenhum movimento registado</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table" data-testid="movimentos-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Viatura</th>
                <th>Obra</th>
                <th>Condutor</th>
                <th>Km Inicial</th>
                <th>Km Final</th>
                <th>Km Percorridos</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>
              {movimentos.map((mov) => (
                <tr key={mov.id}>
                  <td className="text-sm">{mov.data ? new Date(mov.data).toLocaleDateString("pt-PT") : "-"}</td>
                  <td>{getViaturaName(mov.viatura_id)}</td>
                  <td className="text-slate-500">{getObraName(mov.obra_id)}</td>
                  <td className="text-slate-500">{mov.condutor || "-"}</td>
                  <td className="text-slate-500">{mov.km_inicial || 0}</td>
                  <td className="text-slate-500">{mov.km_final || 0}</td>
                  <td className="font-medium">{(mov.km_final || 0) - (mov.km_inicial || 0)} km</td>
                  <td className="text-slate-500 text-sm max-w-xs truncate">{mov.observacoes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Movimento de Viatura</DialogTitle>
            <DialogDescription>Registe a utilização de uma viatura</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>Viatura *</Label>
                <Select value={formData.viatura_id} onValueChange={(v) => setFormData({...formData, viatura_id: v})}>
                  <SelectTrigger className="rounded-sm"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {viaturas.map(v => <SelectItem key={v.id} value={v.id}>{v.matricula} - {v.marca} {v.modelo}</SelectItem>)}
                  </SelectContent>
                </Select>
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
                <Label>Data</Label>
                <Input type="date" value={formData.data} onChange={(e) => setFormData({...formData, data: e.target.value})} className="rounded-sm" />
              </div>
              <div className="space-y-2">
                <Label>Condutor</Label>
                <Input value={formData.condutor} onChange={(e) => setFormData({...formData, condutor: e.target.value})} className="rounded-sm" />
              </div>
              <div className="space-y-2">
                <Label>Km Inicial</Label>
                <Input type="number" min="0" value={formData.km_inicial} onChange={(e) => setFormData({...formData, km_inicial: e.target.value})} className="rounded-sm" />
              </div>
              <div className="space-y-2">
                <Label>Km Final</Label>
                <Input type="number" min="0" value={formData.km_final} onChange={(e) => setFormData({...formData, km_final: e.target.value})} className="rounded-sm" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Observações</Label>
                <Textarea value={formData.observacoes} onChange={(e) => setFormData({...formData, observacoes: e.target.value})} rows={2} className="rounded-sm" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-sm">Cancelar</Button>
              <Button type="submit" className="btn-primary" disabled={!formData.viatura_id}>Registar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
