import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Plus, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const tipoMovOptions = ["Saida", "Devolucao"];

export default function MovimentosAtivos() {
  const { token } = useAuth();
  const [movimentos, setMovimentos] = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);
  const [locais, setLocais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    ativo_id: "",
    tipo_ativo: "equipamento",
    tipo_movimento: "Saida",
    origem_id: "",
    destino_id: "",
    responsavel: "",
    observacoes: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [movRes, eqRes, locRes] = await Promise.all([
        axios.get(`${API}/movimentos/ativos`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/equipamentos`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/locais`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setMovimentos(movRes.data);
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
      const payload = {
        ...formData,
        origem_id: formData.origem_id || null,
        destino_id: formData.destino_id || null
      };
      await axios.post(`${API}/movimentos/ativos`, payload, { headers: { Authorization: `Bearer ${token}` } });
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
      ativo_id: "", tipo_ativo: "equipamento", tipo_movimento: "Saida",
      origem_id: "", destino_id: "", responsavel: "", observacoes: ""
    });
  };

  const getEquipamentoName = (id) => equipamentos.find(e => e.id === id)?.descricao || id;
  const getLocalName = (id) => locais.find(l => l.id === id)?.nome || "-";

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-slate-500">A carregar...</div></div>;

  return (
    <div data-testid="movimentos-ativos-page">
      <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <ArrowLeftRight className="h-8 w-8 text-amber-500" />
            Movimentos de Ativos
          </h1>
          <p className="page-subtitle">Registo de saídas e devoluções de equipamentos</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="btn-primary" data-testid="add-mov-btn">
          <Plus className="h-4 w-4 mr-2" /> Novo Movimento
        </Button>
      </div>

      {movimentos.length === 0 ? (
        <div className="text-center py-12 bg-white border border-slate-200 rounded-sm">
          <ArrowLeftRight className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Nenhum movimento registado</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table" data-testid="movimentos-table">
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Tipo</th>
                <th>Equipamento</th>
                <th>Origem</th>
                <th>Destino</th>
                <th>Responsável</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>
              {movimentos.map((mov) => (
                <tr key={mov.id}>
                  <td className="text-sm">{new Date(mov.data_hora).toLocaleString("pt-PT")}</td>
                  <td>
                    <span className={`badge ${mov.tipo_movimento === "Saida" ? "status-in_use" : "status-available"}`}>
                      {mov.tipo_movimento === "Saida" ? "Saída" : "Devolução"}
                    </span>
                  </td>
                  <td>{getEquipamentoName(mov.ativo_id)}</td>
                  <td className="text-slate-500">{getLocalName(mov.origem_id)}</td>
                  <td className="text-slate-500">{getLocalName(mov.destino_id)}</td>
                  <td className="text-slate-500">{mov.responsavel || "-"}</td>
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
            <DialogTitle>Novo Movimento de Ativo</DialogTitle>
            <DialogDescription>Registe uma saída ou devolução de equipamento</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>Tipo Movimento *</Label>
                <Select value={formData.tipo_movimento} onValueChange={(v) => setFormData({...formData, tipo_movimento: v})}>
                  <SelectTrigger className="rounded-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {tipoMovOptions.map(t => <SelectItem key={t} value={t}>{t === "Saida" ? "Saída" : "Devolução"}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Equipamento *</Label>
                <Select value={formData.ativo_id} onValueChange={(v) => setFormData({...formData, ativo_id: v})}>
                  <SelectTrigger className="rounded-sm"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {equipamentos.map(e => <SelectItem key={e.id} value={e.id}>{e.codigo} - {e.descricao}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Origem</Label>
                <Select value={formData.origem_id} onValueChange={(v) => setFormData({...formData, origem_id: v})}>
                  <SelectTrigger className="rounded-sm"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {locais.map(l => <SelectItem key={l.id} value={l.id}>{l.codigo} - {l.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Destino</Label>
                <Select value={formData.destino_id} onValueChange={(v) => setFormData({...formData, destino_id: v})}>
                  <SelectTrigger className="rounded-sm"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {locais.map(l => <SelectItem key={l.id} value={l.id}>{l.codigo} - {l.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Responsável</Label>
                <input className="form-input" value={formData.responsavel} onChange={(e) => setFormData({...formData, responsavel: e.target.value})} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Observações</Label>
                <Textarea value={formData.observacoes} onChange={(e) => setFormData({...formData, observacoes: e.target.value})} rows={2} className="rounded-sm" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-sm">Cancelar</Button>
              <Button type="submit" className="btn-primary" disabled={!formData.ativo_id}>Registar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
