import { useState, useEffect } from "react";
import { useAuth, useTheme, API } from "@/App";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Wrench, Search, Building2, ArrowRight } from "lucide-react";
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
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === "dark";
  
  const [equipamentos, setEquipamentos] = useState([]);
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [atribuirDialogOpen, setAtribuirDialogOpen] = useState(false);
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
    estado_conservacao: "Bom",
    foto: "",
    obra_id: ""
  });
  const [atribuirData, setAtribuirData] = useState({
    obra_id: "",
    responsavel_levantou: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eqRes, obrasRes] = await Promise.all([
        axios.get(`${API}/equipamentos`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/obras`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setEquipamentos(eqRes.data);
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
      const payload = { ...formData, obra_id: formData.obra_id || null };
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

  const handleAtribuir = async () => {
    try {
      await axios.post(`${API}/movimentos/atribuir`, {
        recurso_id: selectedItem.id,
        tipo_recurso: "equipamento",
        obra_id: atribuirData.obra_id,
        responsavel_levantou: atribuirData.responsavel_levantou
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Equipamento atribuído à obra");
      setAtribuirDialogOpen(false);
      setAtribuirData({ obra_id: "", responsavel_levantou: "" });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao atribuir");
    }
  };

  const handleDevolver = async (item) => {
    try {
      await axios.post(`${API}/movimentos/devolver`, {
        recurso_id: item.id,
        tipo_recurso: "equipamento",
        responsavel_devolveu: ""
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Equipamento devolvido ao armazém");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao devolver");
    }
  };

  const openEditDialog = (item, e) => {
    e?.stopPropagation();
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
      estado_conservacao: item.estado_conservacao || "Bom",
      foto: item.foto || "",
      obra_id: item.obra_id || ""
    });
    setDialogOpen(true);
  };

  const openAtribuirDialog = (item, e) => {
    e?.stopPropagation();
    setSelectedItem(item);
    setAtribuirDialogOpen(true);
  };

  const resetForm = () => {
    setSelectedItem(null);
    setFormData({
      codigo: "", descricao: "", marca: "", modelo: "", data_aquisicao: "",
      ativo: true, categoria: "", numero_serie: "",
      estado_conservacao: "Bom", foto: "", obra_id: ""
    });
  };

  const filtered = equipamentos.filter(e => 
    e.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.marca?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getObraName = (obraId) => {
    const obra = obras.find(o => o.id === obraId);
    return obra ? obra.nome : null;
  };

  if (loading) return <div className={`flex items-center justify-center h-64 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>A carregar...</div>;

  return (
    <div data-testid="equipamentos-page">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className={`text-2xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Wrench className="h-7 w-7 text-orange-500" />
            Equipamentos
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Gestão de equipamentos do armazém</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="bg-orange-500 hover:bg-orange-600 text-black font-semibold" data-testid="add-equipamento-btn">
          <Plus className="h-4 w-4 mr-2" /> Novo Equipamento
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6 relative max-w-md">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`} />
        <Input
          placeholder="Pesquisar por código, descrição ou marca..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`pl-10 ${isDark ? 'bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'}`}
          data-testid="search-input"
        />
      </div>

      {filtered.length === 0 ? (
        <div className={`text-center py-12 rounded-lg border ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-gray-200'}`}>
          <Wrench className={`h-12 w-12 mx-auto mb-4 ${isDark ? 'text-neutral-600' : 'text-gray-300'}`} />
          <p className={isDark ? 'text-neutral-400' : 'text-gray-500'}>{searchTerm ? "Nenhum resultado encontrado" : "Nenhum equipamento registado"}</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className={`hidden md:block overflow-x-auto rounded-lg border ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-gray-200'}`}>
            <table className="w-full" data-testid="equipamentos-table">
              <thead>
                <tr className={`border-b ${isDark ? 'border-neutral-700' : 'border-gray-200'}`}>
                  <th className={`text-left py-3 px-4 font-medium text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Código</th>
                  <th className={`text-left py-3 px-4 font-medium text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Descrição</th>
                  <th className={`text-left py-3 px-4 font-medium text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Marca/Modelo</th>
                  <th className={`text-left py-3 px-4 font-medium text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Estado</th>
                  <th className={`text-left py-3 px-4 font-medium text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Localização</th>
                  <th className={`text-right py-3 px-4 font-medium text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr 
                    key={item.id} 
                    className={`border-b cursor-pointer transition-colors ${isDark ? 'border-neutral-700/50 hover:bg-neutral-700/30' : 'border-gray-100 hover:bg-gray-50'}`}
                    onClick={() => navigate(`/equipamentos/${item.id}`)}
                    data-testid={`equipamento-row-${item.id}`}
                  >
                    <td className="py-3 px-4 font-mono text-sm text-orange-500">{item.codigo}</td>
                    <td className={`py-3 px-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.descricao}</td>
                    <td className={`py-3 px-4 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>{item.marca} {item.modelo}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${item.estado_conservacao === "Bom" ? "bg-emerald-500/20 text-emerald-500" : item.estado_conservacao === "Razoável" ? "bg-amber-500/20 text-amber-500" : "bg-red-500/20 text-red-500"}`}>
                        {item.estado_conservacao}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {item.obra_id ? (
                        <span className="flex items-center gap-1 text-orange-500 text-sm">
                          <Building2 className="h-3 w-3" />
                          {getObraName(item.obra_id)}
                        </span>
                      ) : (
                        <span className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>Em armazém</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      {!item.obra_id && item.ativo ? (
                        <Button variant="ghost" size="sm" onClick={(e) => openAtribuirDialog(item, e)} className="text-orange-500 hover:text-orange-400 hover:bg-orange-500/10" data-testid={`atribuir-${item.id}`}>
                          <ArrowRight className="h-4 w-4 mr-1" /> Obra
                        </Button>
                      ) : item.obra_id ? (
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDevolver(item); }} className="text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10" data-testid={`devolver-${item.id}`}>
                          Devolver
                        </Button>
                      ) : null}
                      <Button variant="ghost" size="sm" onClick={(e) => openEditDialog(item, e)} className={`${isDark ? 'text-neutral-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`} data-testid={`edit-${item.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedItem(item); setDeleteDialogOpen(true); }} className="text-red-500 hover:text-red-400" data-testid={`delete-${item.id}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((item) => (
              <div 
                key={item.id}
                className={`p-4 rounded-lg border cursor-pointer ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-gray-200'}`}
                onClick={() => navigate(`/equipamentos/${item.id}`)}
                data-testid={`equipamento-card-${item.id}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-mono text-sm text-orange-500">{item.codigo}</span>
                    <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.descricao}</h3>
                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>{item.marca} {item.modelo}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${item.estado_conservacao === "Bom" ? "bg-emerald-500/20 text-emerald-500" : item.estado_conservacao === "Razoável" ? "bg-amber-500/20 text-amber-500" : "bg-red-500/20 text-red-500"}`}>
                    {item.estado_conservacao}
                  </span>
                </div>
                <div className={`text-sm mb-3 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                  {item.obra_id ? (
                    <span className="flex items-center gap-1 text-orange-500">
                      <Building2 className="h-3 w-3" />
                      {getObraName(item.obra_id)}
                    </span>
                  ) : "Em armazém"}
                </div>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  {!item.obra_id && item.ativo ? (
                    <Button size="sm" onClick={(e) => openAtribuirDialog(item, e)} className="bg-orange-500 hover:bg-orange-600 text-black text-xs flex-1">
                      <ArrowRight className="h-3 w-3 mr-1" /> Atribuir a Obra
                    </Button>
                  ) : item.obra_id ? (
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleDevolver(item); }} className="text-emerald-500 border-emerald-500 hover:bg-emerald-500/10 text-xs flex-1">
                      Devolver
                    </Button>
                  ) : null}
                  <Button size="sm" variant="outline" onClick={(e) => openEditDialog(item, e)} className={`text-xs ${isDark ? 'border-neutral-600' : 'border-gray-300'}`}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={`sm:max-w-2xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-gray-200'}`}>
          <DialogHeader>
            <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>{selectedItem ? "Editar Equipamento" : "Novo Equipamento"}</DialogTitle>
            <DialogDescription className={isDark ? 'text-neutral-400' : 'text-gray-500'}>Preencha os dados do equipamento</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label className={isDark ? 'text-neutral-300' : 'text-gray-700'}>Código *</Label>
                <Input value={formData.codigo} onChange={(e) => setFormData({...formData, codigo: e.target.value})} required data-testid="codigo-input" className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-gray-300'} />
              </div>
              <div className="space-y-2">
                <Label className={isDark ? 'text-neutral-300' : 'text-gray-700'}>Descrição *</Label>
                <Input value={formData.descricao} onChange={(e) => setFormData({...formData, descricao: e.target.value})} required data-testid="descricao-input" className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-gray-300'} />
              </div>
              <div className="space-y-2">
                <Label className={isDark ? 'text-neutral-300' : 'text-gray-700'}>Marca</Label>
                <Input value={formData.marca} onChange={(e) => setFormData({...formData, marca: e.target.value})} className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-gray-300'} />
              </div>
              <div className="space-y-2">
                <Label className={isDark ? 'text-neutral-300' : 'text-gray-700'}>Modelo</Label>
                <Input value={formData.modelo} onChange={(e) => setFormData({...formData, modelo: e.target.value})} className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-gray-300'} />
              </div>
              <div className="space-y-2">
                <Label className={isDark ? 'text-neutral-300' : 'text-gray-700'}>Categoria</Label>
                <Input value={formData.categoria} onChange={(e) => setFormData({...formData, categoria: e.target.value})} placeholder="Ex: Aparafusadora" className={isDark ? 'bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500' : 'bg-white border-gray-300 placeholder:text-gray-400'} />
              </div>
              <div className="space-y-2">
                <Label className={isDark ? 'text-neutral-300' : 'text-gray-700'}>Nº Série</Label>
                <Input value={formData.numero_serie} onChange={(e) => setFormData({...formData, numero_serie: e.target.value})} className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-gray-300'} />
              </div>
              <div className="space-y-2">
                <Label className={isDark ? 'text-neutral-300' : 'text-gray-700'}>Data Aquisição</Label>
                <Input type="date" value={formData.data_aquisicao} onChange={(e) => setFormData({...formData, data_aquisicao: e.target.value})} className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-gray-300'} />
              </div>
              <div className="space-y-2">
                <Label className={isDark ? 'text-neutral-300' : 'text-gray-700'}>Estado Conservação</Label>
                <Select value={formData.estado_conservacao} onValueChange={(v) => setFormData({...formData, estado_conservacao: v})}>
                  <SelectTrigger className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-gray-300'}><SelectValue /></SelectTrigger>
                  <SelectContent className={isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-gray-200'}>
                    {estadoOptions.map(e => <SelectItem key={e} value={e} className={isDark ? 'text-white hover:bg-neutral-700' : ''}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className={isDark ? 'text-neutral-300' : 'text-gray-700'}>URL Foto</Label>
                <Input value={formData.foto} onChange={(e) => setFormData({...formData, foto: e.target.value})} placeholder="https://..." className={isDark ? 'bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500' : 'bg-white border-gray-300 placeholder:text-gray-400'} />
              </div>
              <div className="md:col-span-2">
                <ImageUpload value={formData.foto} onChange={(url) => setFormData({...formData, foto: url})} label="Ou carregar foto" />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={formData.ativo} onCheckedChange={(v) => setFormData({...formData, ativo: v})} />
                <Label className={isDark ? 'text-neutral-300' : 'text-gray-700'}>Ativo</Label>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className={`w-full sm:w-auto ${isDark ? 'border-neutral-600 text-neutral-300 hover:bg-neutral-800' : 'border-gray-300'}`}>Cancelar</Button>
              <Button type="submit" className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-black font-semibold">{selectedItem ? "Guardar" : "Criar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Atribuir Dialog */}
      <Dialog open={atribuirDialogOpen} onOpenChange={setAtribuirDialogOpen}>
        <DialogContent className={`sm:max-w-md ${isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-gray-200'}`}>
          <DialogHeader>
            <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>Atribuir a Obra</DialogTitle>
            <DialogDescription className={isDark ? 'text-neutral-400' : 'text-gray-500'}>
              Atribuir "{selectedItem?.descricao}" a uma obra
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className={isDark ? 'text-neutral-300' : 'text-gray-700'}>Obra *</Label>
              <Select value={atribuirData.obra_id} onValueChange={(v) => setAtribuirData({...atribuirData, obra_id: v})}>
                <SelectTrigger className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-gray-300'}><SelectValue placeholder="Selecione uma obra" /></SelectTrigger>
                <SelectContent className={isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-gray-200'}>
                  {obras.filter(o => o.estado === "Ativa").map(o => <SelectItem key={o.id} value={o.id} className={isDark ? 'text-white hover:bg-neutral-700' : ''}>{o.codigo} - {o.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className={isDark ? 'text-neutral-300' : 'text-gray-700'}>Responsável pelo levantamento</Label>
              <Input value={atribuirData.responsavel_levantou} onChange={(e) => setAtribuirData({...atribuirData, responsavel_levantou: e.target.value})} placeholder="Nome de quem levantou" className={isDark ? 'bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500' : 'bg-white border-gray-300 placeholder:text-gray-400'} />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={() => setAtribuirDialogOpen(false)} className={`w-full sm:w-auto ${isDark ? 'border-neutral-600 text-neutral-300 hover:bg-neutral-800' : 'border-gray-300'}`}>Cancelar</Button>
            <Button onClick={handleAtribuir} disabled={!atribuirData.obra_id} className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-black font-semibold">
              <ArrowRight className="h-4 w-4 mr-2" /> Atribuir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className={isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-gray-200'}>
          <AlertDialogHeader>
            <AlertDialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>Eliminar Equipamento</AlertDialogTitle>
            <AlertDialogDescription className={isDark ? 'text-neutral-400' : 'text-gray-500'}>Tem a certeza que deseja eliminar "{selectedItem?.descricao}"?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className={`w-full sm:w-auto ${isDark ? 'border-neutral-600 text-neutral-300 hover:bg-neutral-800' : 'border-gray-300'}`}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
