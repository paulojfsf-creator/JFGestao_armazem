import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Plus, ArrowLeftRight, ArrowRight, ArrowLeft } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MovimentosAtivos() {
  const { token } = useAuth();
  const [movimentos, setMovimentos] = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);
  const [viaturas, setViaturas] = useState([]);
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tipoMovimento, setTipoMovimento] = useState("atribuir");
  const [formData, setFormData] = useState({
    recurso_id: "",
    tipo_recurso: "equipamento",
    obra_id: "",
    responsavel_levantou: "",
    responsavel_devolveu: "",
    data_levantamento: "",
    data_devolucao: "",
    observacoes: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [movRes, eqRes, viRes, obrasRes] = await Promise.all([
        axios.get(`${API}/movimentos`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/equipamentos`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/viaturas`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/obras`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setMovimentos(movRes.data);
      setEquipamentos(eqRes.data);
      setViaturas(viRes.data);
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
      const endpoint = tipoMovimento === "atribuir" ? "/movimentos/atribuir" : "/movimentos/devolver";
      const payload = {
        recurso_id: formData.recurso_id,
        tipo_recurso: formData.tipo_recurso,
        obra_id: formData.obra_id || null,
        responsavel_levantou: formData.responsavel_levantou,
        responsavel_devolveu: formData.responsavel_devolveu,
        data_levantamento: formData.data_levantamento || null,
        data_devolucao: formData.data_devolucao || null,
        observacoes: formData.observacoes
      };
      
      await axios.post(`${API}${endpoint}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(tipoMovimento === "atribuir" ? "Recurso atribuído com sucesso" : "Recurso devolvido com sucesso");
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao registar movimento");
    }
  };

  const resetForm = () => {
    setFormData({
      recurso_id: "", tipo_recurso: "equipamento", obra_id: "",
      responsavel_levantou: "", responsavel_devolveu: "",
      data_levantamento: "", data_devolucao: "", observacoes: ""
    });
  };

  const getRecursoName = (id, tipo) => {
    if (tipo === "equipamento") {
      const eq = equipamentos.find(e => e.id === id);
      return eq ? `${eq.codigo} - ${eq.descricao}` : id;
    } else {
      const v = viaturas.find(v => v.id === id);
      return v ? `${v.matricula} - ${v.marca} ${v.modelo}` : id;
    }
  };
  
  const getObraName = (id) => obras.find(o => o.id === id)?.nome || "-";

  // Filter recursos based on tipo_recurso and tipoMovimento
  const getAvailableRecursos = () => {
    if (formData.tipo_recurso === "equipamento") {
      if (tipoMovimento === "atribuir") {
        return equipamentos.filter(e => !e.obra_id && e.ativo);
      } else {
        return equipamentos.filter(e => e.obra_id);
      }
    } else {
      if (tipoMovimento === "atribuir") {
        return viaturas.filter(v => !v.obra_id && v.ativa);
      } else {
        return viaturas.filter(v => v.obra_id);
      }
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-neutral-400">A carregar...</div></div>;

  return (
    <div data-testid="movimentos-ativos-page" className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <ArrowLeftRight className="h-7 w-7 text-orange-500" />
            Movimentos de Ativos
          </h1>
          <p className="text-neutral-400 text-sm mt-1">Atribuição e devolução de equipamentos e viaturas</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="bg-orange-500 hover:bg-orange-600 text-black font-semibold" data-testid="add-mov-btn">
          <Plus className="h-4 w-4 mr-2" /> Novo Movimento
        </Button>
      </div>

      {movimentos.length === 0 ? (
        <div className="text-center py-12 bg-neutral-800 border border-neutral-700 rounded-lg">
          <ArrowLeftRight className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
          <p className="text-neutral-400">Nenhum movimento registado</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-neutral-800 border border-neutral-700 rounded-lg">
          <table className="w-full" data-testid="movimentos-table">
            <thead>
              <tr className="border-b border-neutral-700">
                <th className="text-left py-3 px-4 text-neutral-400 font-medium text-sm">Data/Hora</th>
                <th className="text-left py-3 px-4 text-neutral-400 font-medium text-sm">Tipo</th>
                <th className="text-left py-3 px-4 text-neutral-400 font-medium text-sm">Recurso</th>
                <th className="text-left py-3 px-4 text-neutral-400 font-medium text-sm">Obra</th>
                <th className="text-left py-3 px-4 text-neutral-400 font-medium text-sm">Responsável</th>
              </tr>
            </thead>
            <tbody>
              {movimentos.map((mov) => (
                <tr key={mov.id} className="border-b border-neutral-700/50 hover:bg-neutral-700/30">
                  <td className="py-3 px-4 text-sm text-neutral-300">{new Date(mov.created_at).toLocaleString("pt-PT")}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-fit ${mov.tipo_movimento === "Saida" ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                      {mov.tipo_movimento === "Saida" ? <ArrowRight className="h-3 w-3" /> : <ArrowLeft className="h-3 w-3" />}
                      {mov.tipo_movimento === "Saida" ? "Saída" : "Devolução"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-white">{getRecursoName(mov.recurso_id, mov.tipo_recurso)}</td>
                  <td className="py-3 px-4 text-neutral-400">{getObraName(mov.obra_id)}</td>
                  <td className="py-3 px-4 text-neutral-400">{mov.responsavel_levantou || mov.responsavel_devolveu || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-neutral-900 border-neutral-700">
          <DialogHeader>
            <DialogTitle className="text-white">Novo Movimento</DialogTitle>
            <DialogDescription className="text-neutral-400">Atribua ou devolva um recurso</DialogDescription>
          </DialogHeader>
          
          <Tabs value={tipoMovimento} onValueChange={(v) => { setTipoMovimento(v); setFormData({...formData, recurso_id: ""}); }} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-neutral-800">
              <TabsTrigger value="atribuir" className="data-[state=active]:bg-orange-500 data-[state=active]:text-black">
                <ArrowRight className="h-4 w-4 mr-2" /> Atribuir a Obra
              </TabsTrigger>
              <TabsTrigger value="devolver" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black">
                <ArrowLeft className="h-4 w-4 mr-2" /> Devolver
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 py-4">
              <div className="space-y-2">
                <Label className="text-neutral-300">Tipo de Recurso *</Label>
                <Select value={formData.tipo_recurso} onValueChange={(v) => setFormData({...formData, tipo_recurso: v, recurso_id: ""})}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    <SelectItem value="equipamento" className="text-white hover:bg-neutral-700">Equipamento</SelectItem>
                    <SelectItem value="viatura" className="text-white hover:bg-neutral-700">Viatura</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-neutral-300">{formData.tipo_recurso === "equipamento" ? "Equipamento" : "Viatura"} *</Label>
                <Select value={formData.recurso_id} onValueChange={(v) => setFormData({...formData, recurso_id: v})}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    {getAvailableRecursos().map(r => (
                      <SelectItem key={r.id} value={r.id} className="text-white hover:bg-neutral-700">
                        {formData.tipo_recurso === "equipamento" ? `${r.codigo} - ${r.descricao}` : `${r.matricula} - ${r.marca} ${r.modelo}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {getAvailableRecursos().length === 0 && (
                  <p className="text-xs text-amber-400">
                    {tipoMovimento === "atribuir" 
                      ? "Não há recursos disponíveis para atribuição"
                      : "Não há recursos para devolver"}
                  </p>
                )}
              </div>

              {tipoMovimento === "atribuir" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-neutral-300">Obra de Destino *</Label>
                    <Select value={formData.obra_id} onValueChange={(v) => setFormData({...formData, obra_id: v})}>
                      <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white"><SelectValue placeholder="Selecione a obra" /></SelectTrigger>
                      <SelectContent className="bg-neutral-800 border-neutral-700">
                        {obras.filter(o => o.estado === "Ativa").map(o => (
                          <SelectItem key={o.id} value={o.id} className="text-white hover:bg-neutral-700">{o.codigo} - {o.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-neutral-300">Responsável pelo Levantamento</Label>
                    <Input 
                      value={formData.responsavel_levantou} 
                      onChange={(e) => setFormData({...formData, responsavel_levantou: e.target.value})} 
                      className="bg-neutral-800 border-neutral-700 text-white"
                      placeholder="Nome de quem levantou"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-neutral-300">Data de Levantamento</Label>
                    <Input 
                      type="datetime-local"
                      value={formData.data_levantamento} 
                      onChange={(e) => setFormData({...formData, data_levantamento: e.target.value})} 
                      className="bg-neutral-800 border-neutral-700 text-white"
                    />
                  </div>
                </>
              )}

              {tipoMovimento === "devolver" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-neutral-300">Responsável pela Devolução</Label>
                    <Input 
                      value={formData.responsavel_devolveu} 
                      onChange={(e) => setFormData({...formData, responsavel_devolveu: e.target.value})} 
                      className="bg-neutral-800 border-neutral-700 text-white"
                      placeholder="Nome de quem devolveu"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-neutral-300">Data de Devolução</Label>
                    <Input 
                      type="datetime-local"
                      value={formData.data_devolucao} 
                      onChange={(e) => setFormData({...formData, data_devolucao: e.target.value})} 
                      className="bg-neutral-800 border-neutral-700 text-white"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label className="text-neutral-300">Observações</Label>
                <Textarea 
                  value={formData.observacoes} 
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})} 
                  rows={2} 
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-neutral-600 text-neutral-300 hover:bg-neutral-800">Cancelar</Button>
              <Button 
                type="submit" 
                className={tipoMovimento === "atribuir" ? "bg-orange-500 hover:bg-orange-600 text-black font-semibold" : "bg-emerald-500 hover:bg-emerald-600 text-white"} 
                disabled={!formData.recurso_id || (tipoMovimento === "atribuir" && !formData.obra_id)}
              >
                {tipoMovimento === "atribuir" ? "Atribuir" : "Devolver"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
