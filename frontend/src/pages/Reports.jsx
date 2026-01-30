import { useState, useEffect, useRef } from "react";
import { useAuth, useTheme, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { 
  FileText, Download, FileSpreadsheet, Upload, Filter, 
  Building2, Calendar, TrendingDown, TrendingUp, Package,
  Truck, Wrench, BarChart3, ArrowRightLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const meses = [
  { value: "1", label: "Janeiro" },
  { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Maio" },
  { value: "6", label: "Junho" },
  { value: "7", label: "Julho" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" }
];

const anos = Array.from({ length: 5 }, (_, i) => {
  const ano = new Date().getFullYear() - i;
  return { value: String(ano), label: String(ano) };
});

export default function Reports() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  const [downloading, setDownloading] = useState({ pdf: false, excel: false });
  const [uploading, setUploading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  
  // Filtros
  const [filtroObra, setFiltroObra] = useState("");
  const [filtroMes, setFiltroMes] = useState("");
  const [filtroAno, setFiltroAno] = useState(String(new Date().getFullYear()));
  
  // Dados dos relatórios
  const [relatorioMovimentos, setRelatorioMovimentos] = useState(null);
  const [relatorioStock, setRelatorioStock] = useState(null);
  const [relatorioObra, setRelatorioObra] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [summaryRes, obrasRes] = await Promise.all([
        axios.get(`${API}/summary`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/obras`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setSummary(summaryRes.data);
      setObras(obrasRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchRelatorioMovimentos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroObra && filtroObra !== "all") params.append("obra_id", filtroObra);
      if (filtroMes && filtroMes !== "all") params.append("mes", filtroMes);
      if (filtroAno) params.append("ano", filtroAno);
      
      const response = await axios.get(`${API}/relatorios/movimentos?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRelatorioMovimentos(response.data);
    } catch (error) {
      toast.error("Erro ao carregar relatório de movimentos");
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatorioStock = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroObra && filtroObra !== "all") params.append("obra_id", filtroObra);
      if (filtroMes && filtroMes !== "all") params.append("mes", filtroMes);
      if (filtroAno) params.append("ano", filtroAno);
      
      const response = await axios.get(`${API}/relatorios/stock?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRelatorioStock(response.data);
    } catch (error) {
      toast.error("Erro ao carregar relatório de stock");
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatorioObra = async () => {
    if (!filtroObra || filtroObra === "all") {
      toast.error("Selecione uma obra para ver o relatório");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroMes && filtroMes !== "all") params.append("mes", filtroMes);
      if (filtroAno) params.append("ano", filtroAno);
      
      const response = await axios.get(`${API}/relatorios/obra/${filtroObra}?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRelatorioObra(response.data);
    } catch (error) {
      toast.error("Erro ao carregar relatório da obra");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    setDownloading({ ...downloading, pdf: true });
    try {
      const response = await axios.get(`${API}/export/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob"
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "relatorio_armazem.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("Relatório PDF exportado com sucesso");
    } catch (error) {
      toast.error("Erro ao exportar PDF");
    } finally {
      setDownloading({ ...downloading, pdf: false });
    }
  };

  const downloadExcel = async () => {
    setDownloading({ ...downloading, excel: true });
    try {
      const response = await axios.get(`${API}/export/excel`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob"
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "dados_armazem.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("Dados Excel exportados com sucesso");
    } catch (error) {
      toast.error("Erro ao exportar Excel");
    } finally {
      setDownloading({ ...downloading, excel: false });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error("Por favor, selecione um ficheiro Excel (.xlsx ou .xls)");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API}/import/excel`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const { imported } = response.data;
      const total = (imported.equipamentos || 0) + (imported.viaturas || 0) + (imported.materiais || 0) + (imported.obras || 0);
      
      if (total > 0) {
        toast.success(`Importação concluída: ${imported.equipamentos || 0} equipamentos, ${imported.viaturas || 0} viaturas, ${imported.materiais || 0} materiais, ${imported.obras || 0} obras`);
        fetchInitialData();
      } else {
        toast.info("Nenhum registo novo importado. Verifique se os códigos já existem no sistema.");
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao importar ficheiro");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString("pt-PT", {
        day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
      });
    } catch { return dateStr; }
  };

  const getObraNome = (obraId) => {
    const obra = obras.find(o => o.id === obraId);
    return obra ? obra.nome : "-";
  };

  return (
    <div data-testid="reports-page" className="animate-fade-in">
      <div className="mb-8">
        <h1 className={`text-2xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <BarChart3 className="h-7 w-7 text-orange-500" />
          Relatórios e Dados
        </h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Relatórios avançados, exportação e importação de dados</p>
      </div>

      <Tabs defaultValue="avancados" className="space-y-6">
        <TabsList className={`grid w-full grid-cols-2 ${isDark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
          <TabsTrigger value="avancados" className="data-[state=active]:bg-orange-500 data-[state=active]:text-black">
            <Filter className="h-4 w-4 mr-2" /> Relatórios Avançados
          </TabsTrigger>
          <TabsTrigger value="exportar" className="data-[state=active]:bg-orange-500 data-[state=active]:text-black">
            <Download className="h-4 w-4 mr-2" /> Exportar/Importar
          </TabsTrigger>
        </TabsList>

        {/* TAB: Relatórios Avançados */}
        <TabsContent value="avancados" className="space-y-6">
          {/* Filtros */}
          <Card className={isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-gray-200'}>
            <CardHeader className="pb-4">
              <CardTitle className={`text-lg flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <Filter className="h-5 w-5 text-orange-500" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>Obra</label>
                  <Select value={filtroObra} onValueChange={setFiltroObra}>
                    <SelectTrigger className={isDark ? 'bg-neutral-700 border-neutral-600 text-white' : 'bg-white border-gray-300 text-gray-900'}>
                      <SelectValue placeholder="Todas as obras" />
                    </SelectTrigger>
                    <SelectContent className={isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-gray-200'}>
                      <SelectItem value="all" className={isDark ? 'text-white' : 'text-gray-900'}>Todas as obras</SelectItem>
                      {obras.map(o => (
                        <SelectItem key={o.id} value={o.id} className={isDark ? 'text-white' : 'text-gray-900'}>
                          {o.codigo} - {o.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>Mês</label>
                  <Select value={filtroMes} onValueChange={setFiltroMes}>
                    <SelectTrigger className={isDark ? 'bg-neutral-700 border-neutral-600 text-white' : 'bg-white border-gray-300 text-gray-900'}>
                      <SelectValue placeholder="Todos os meses" />
                    </SelectTrigger>
                    <SelectContent className={isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-gray-200'}>
                      <SelectItem value="all" className={isDark ? 'text-white' : 'text-gray-900'}>Todos os meses</SelectItem>
                      {meses.map(m => (
                        <SelectItem key={m.value} value={m.value} className={isDark ? 'text-white' : 'text-gray-900'}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>Ano</label>
                  <Select value={filtroAno} onValueChange={setFiltroAno}>
                    <SelectTrigger className={isDark ? 'bg-neutral-700 border-neutral-600 text-white' : 'bg-white border-gray-300 text-gray-900'}>
                      <SelectValue placeholder="Selecione o ano" />
                    </SelectTrigger>
                    <SelectContent className={isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-gray-200'}>
                      {anos.map(a => (
                        <SelectItem key={a.value} value={a.value} className={isDark ? 'text-white' : 'text-gray-900'}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={fetchRelatorioMovimentos} disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-black font-semibold flex-1">
                    <ArrowRightLeft className="h-4 w-4 mr-2" /> Movimentos
                  </Button>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={fetchRelatorioStock} disabled={loading} variant="outline" className={isDark ? 'border-neutral-600 text-neutral-300 hover:bg-neutral-700' : 'border-gray-300'}>
                  <Package className="h-4 w-4 mr-2" /> Consumo de Materiais
                </Button>
                <Button onClick={fetchRelatorioObra} disabled={loading || !filtroObra} variant="outline" className={isDark ? 'border-neutral-600 text-neutral-300 hover:bg-neutral-700' : 'border-gray-300'}>
                  <Building2 className="h-4 w-4 mr-2" /> Relatório da Obra
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Resultados - Movimentos */}
          {relatorioMovimentos && (
            <Card className={isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-gray-200'}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <ArrowRightLeft className="h-5 w-5 text-orange-500" />
                  Relatório de Movimentos de Ativos
                </CardTitle>
                <CardDescription className={isDark ? 'text-neutral-400' : 'text-gray-500'}>
                  {filtroObra ? `Obra: ${getObraNome(filtroObra)}` : "Todas as obras"} • 
                  {filtroMes ? ` ${meses.find(m => m.value === filtroMes)?.label}` : ""} {filtroAno}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Estatísticas */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-neutral-700/50' : 'bg-gray-50'}`}>
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{relatorioMovimentos.estatisticas.total_movimentos}</p>
                    <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Total Movimentos</p>
                  </div>
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
                    <p className="text-2xl font-bold text-amber-500">{relatorioMovimentos.estatisticas.total_saidas}</p>
                    <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Saídas</p>
                  </div>
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                    <p className="text-2xl font-bold text-emerald-500">{relatorioMovimentos.estatisticas.total_devolucoes}</p>
                    <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Devoluções</p>
                  </div>
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-neutral-700/50' : 'bg-gray-50'}`}>
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{relatorioMovimentos.estatisticas.equipamentos_movidos}</p>
                    <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Equipamentos</p>
                  </div>
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-neutral-700/50' : 'bg-gray-50'}`}>
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{relatorioMovimentos.estatisticas.viaturas_movidas}</p>
                    <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Viaturas</p>
                  </div>
                </div>
                
                {/* Tabela de Movimentos */}
                {relatorioMovimentos.movimentos.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={`border-b ${isDark ? 'border-neutral-700 text-neutral-400' : 'border-gray-200 text-gray-500'}`}>
                          <th className="text-left py-3 px-2">Data</th>
                          <th className="text-left py-3 px-2">Tipo</th>
                          <th className="text-left py-3 px-2">Recurso</th>
                          <th className="text-left py-3 px-2">Obra</th>
                          <th className="text-left py-3 px-2">Responsável</th>
                        </tr>
                      </thead>
                      <tbody>
                        {relatorioMovimentos.movimentos.slice(0, 20).map((mov, idx) => (
                          <tr key={mov.id || idx} className={`border-b ${isDark ? 'border-neutral-700/50' : 'border-gray-100'}`}>
                            <td className={`py-2 px-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>{formatDate(mov.created_at)}</td>
                            <td className="py-2 px-2">
                              <Badge className={mov.tipo_movimento === "Saida" ? "bg-amber-500/20 text-amber-500" : "bg-emerald-500/20 text-emerald-500"}>
                                {mov.tipo_movimento === "Saida" ? "Saída" : "Devolução"}
                              </Badge>
                            </td>
                            <td className={`py-2 px-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              <span className="flex items-center gap-1">
                                {mov.tipo_recurso === "equipamento" ? <Wrench className="h-3 w-3 text-orange-500" /> : <Truck className="h-3 w-3 text-orange-500" />}
                                {mov.recurso_codigo} - {mov.recurso_descricao}
                              </span>
                            </td>
                            <td className={`py-2 px-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>{mov.obra_nome || "-"}</td>
                            <td className={`py-2 px-2 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                              {mov.tipo_movimento === "Saida" ? mov.responsavel_levantou : mov.responsavel_devolveu || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {relatorioMovimentos.movimentos.length > 20 && (
                      <p className={`text-center py-2 text-sm ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
                        A mostrar 20 de {relatorioMovimentos.movimentos.length} movimentos
                      </p>
                    )}
                  </div>
                ) : (
                  <p className={`text-center py-8 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>Nenhum movimento encontrado para os filtros selecionados</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Resultados - Stock */}
          {relatorioStock && (
            <Card className={isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-gray-200'}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <Package className="h-5 w-5 text-orange-500" />
                  Relatório de Consumo de Materiais
                </CardTitle>
                <CardDescription className={isDark ? 'text-neutral-400' : 'text-gray-500'}>
                  {filtroObra ? `Obra: ${getObraNome(filtroObra)}` : "Todas as obras"} • 
                  {filtroMes ? ` ${meses.find(m => m.value === filtroMes)?.label}` : ""} {filtroAno}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Estatísticas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-neutral-700/50' : 'bg-gray-50'}`}>
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{relatorioStock.estatisticas.total_movimentos}</p>
                    <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Total Movimentos</p>
                  </div>
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                    <p className="text-2xl font-bold text-emerald-500 flex items-center gap-1">
                      <TrendingUp className="h-5 w-5" /> {relatorioStock.estatisticas.total_entradas}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Entradas</p>
                  </div>
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-red-500/10' : 'bg-red-50'}`}>
                    <p className="text-2xl font-bold text-red-500 flex items-center gap-1">
                      <TrendingDown className="h-5 w-5" /> {relatorioStock.estatisticas.total_saidas}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Saídas</p>
                  </div>
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-neutral-700/50' : 'bg-gray-50'}`}>
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{relatorioStock.estatisticas.materiais_diferentes}</p>
                    <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Materiais Diferentes</p>
                  </div>
                </div>
                
                {/* Resumo por Material */}
                {relatorioStock.materiais_resumo.length > 0 && (
                  <div className="mb-6">
                    <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>Consumo por Material</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {relatorioStock.materiais_resumo.map((mat, idx) => (
                        <div key={idx} className={`p-3 rounded-lg border ${isDark ? 'bg-neutral-700/30 border-neutral-600' : 'bg-gray-50 border-gray-200'}`}>
                          <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{mat.codigo}</p>
                          <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>{mat.descricao}</p>
                          <div className="flex justify-between mt-2 text-xs">
                            <span className="text-emerald-500">+{mat.entradas} {mat.unidade}</span>
                            <span className="text-red-500">-{mat.saidas} {mat.unidade}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Resultados - Obra */}
          {relatorioObra && (
            <Card className={isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-gray-200'}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <Building2 className="h-5 w-5 text-orange-500" />
                  Relatório da Obra: {relatorioObra.obra.nome}
                </CardTitle>
                <CardDescription className={isDark ? 'text-neutral-400' : 'text-gray-500'}>
                  {relatorioObra.obra.codigo} • {relatorioObra.obra.endereco || "Sem endereço"} •
                  {filtroMes ? ` ${meses.find(m => m.value === filtroMes)?.label}` : ""} {filtroAno}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Estatísticas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-orange-500/10' : 'bg-orange-50'}`}>
                    <p className="text-2xl font-bold text-orange-500">{relatorioObra.estatisticas.equipamentos_atuais}</p>
                    <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Equipamentos na Obra</p>
                  </div>
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-orange-500/10' : 'bg-orange-50'}`}>
                    <p className="text-2xl font-bold text-orange-500">{relatorioObra.estatisticas.viaturas_atuais}</p>
                    <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Viaturas na Obra</p>
                  </div>
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
                    <p className="text-2xl font-bold text-amber-500">{relatorioObra.estatisticas.total_saidas_ativos}</p>
                    <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Atribuições no Período</p>
                  </div>
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-neutral-700/50' : 'bg-gray-50'}`}>
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{relatorioObra.estatisticas.movimentos_stock}</p>
                    <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Mov. de Materiais</p>
                  </div>
                </div>
                
                {/* Consumo de Materiais na Obra */}
                {relatorioObra.consumo_materiais.length > 0 && (
                  <div className="mb-6">
                    <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>Materiais Consumidos na Obra</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className={`border-b ${isDark ? 'border-neutral-700 text-neutral-400' : 'border-gray-200 text-gray-500'}`}>
                            <th className="text-left py-2">Código</th>
                            <th className="text-left py-2">Descrição</th>
                            <th className="text-right py-2">Quantidade Gasta</th>
                          </tr>
                        </thead>
                        <tbody>
                          {relatorioObra.consumo_materiais.map((mat, idx) => (
                            <tr key={idx} className={`border-b ${isDark ? 'border-neutral-700/50' : 'border-gray-100'}`}>
                              <td className={`py-2 font-mono text-orange-500`}>{mat.codigo}</td>
                              <td className={`py-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{mat.descricao}</td>
                              <td className={`py-2 text-right font-medium ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                                {mat.quantidade_gasta} {mat.unidade}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                {/* Recursos Atuais */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                      <Wrench className="h-4 w-4 text-orange-500" /> Equipamentos na Obra
                    </h4>
                    {relatorioObra.recursos_atuais.equipamentos.length > 0 ? (
                      <div className="space-y-2">
                        {relatorioObra.recursos_atuais.equipamentos.slice(0, 5).map(eq => (
                          <div key={eq.id} className={`p-2 rounded border text-sm ${isDark ? 'bg-neutral-700/30 border-neutral-600' : 'bg-gray-50 border-gray-200'}`}>
                            <span className="text-orange-500 font-mono">{eq.codigo}</span> - <span className={isDark ? 'text-white' : 'text-gray-900'}>{eq.descricao}</span>
                          </div>
                        ))}
                        {relatorioObra.recursos_atuais.equipamentos.length > 5 && (
                          <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>+{relatorioObra.recursos_atuais.equipamentos.length - 5} mais</p>
                        )}
                      </div>
                    ) : (
                      <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>Nenhum equipamento na obra</p>
                    )}
                  </div>
                  <div>
                    <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                      <Truck className="h-4 w-4 text-orange-500" /> Viaturas na Obra
                    </h4>
                    {relatorioObra.recursos_atuais.viaturas.length > 0 ? (
                      <div className="space-y-2">
                        {relatorioObra.recursos_atuais.viaturas.slice(0, 5).map(v => (
                          <div key={v.id} className={`p-2 rounded border text-sm ${isDark ? 'bg-neutral-700/30 border-neutral-600' : 'bg-gray-50 border-gray-200'}`}>
                            <span className="text-orange-500 font-mono">{v.matricula}</span> - <span className={isDark ? 'text-white' : 'text-gray-900'}>{v.marca} {v.modelo}</span>
                          </div>
                        ))}
                        {relatorioObra.recursos_atuais.viaturas.length > 5 && (
                          <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>+{relatorioObra.recursos_atuais.viaturas.length - 5} mais</p>
                        )}
                      </div>
                    ) : (
                      <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>Nenhuma viatura na obra</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB: Exportar/Importar */}
        <TabsContent value="exportar" className="space-y-6">
          {/* Summary Preview */}
          {summary && (
            <Card className={isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-gray-200'}>
              <CardHeader>
                <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>Resumo do Armazém</CardTitle>
                <CardDescription className={isDark ? 'text-neutral-400' : 'text-gray-500'}>Dados atuais que serão incluídos nos relatórios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-neutral-700/50' : 'bg-gray-50'}`}>
                    <p className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{summary.equipamentos?.total || 0}</p>
                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Equipamentos</p>
                  </div>
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-neutral-700/50' : 'bg-gray-50'}`}>
                    <p className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{summary.viaturas?.total || 0}</p>
                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Viaturas</p>
                  </div>
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-neutral-700/50' : 'bg-gray-50'}`}>
                    <p className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{summary.materiais?.total || 0}</p>
                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Materiais</p>
                  </div>
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-neutral-700/50' : 'bg-gray-50'}`}>
                    <p className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{summary.obras?.total || 0}</p>
                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Obras</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export/Import Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* PDF Export */}
            <Card className={`hover:border-red-500/50 transition-colors ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-gray-200'}`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <FileText className="h-5 w-5 text-red-500" />
                  Relatório PDF
                </CardTitle>
                <CardDescription className={isDark ? 'text-neutral-400' : 'text-gray-500'}>
                  Exportar resumo em PDF para impressão
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className={`text-sm space-y-1 mb-4 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                  <li>• Resumo geral do armazém</li>
                  <li>• Totais por categoria</li>
                  <li>• Ideal para impressão</li>
                </ul>
                <Button 
                  onClick={downloadPDF} 
                  disabled={downloading.pdf}
                  className="w-full bg-red-500 hover:bg-red-600 text-white"
                  data-testid="export-pdf-btn"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {downloading.pdf ? "A exportar..." : "Exportar PDF"}
                </Button>
              </CardContent>
            </Card>

            {/* Excel Export */}
            <Card className={`hover:border-emerald-500/50 transition-colors ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-gray-200'}`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
                  Exportar Excel
                </CardTitle>
                <CardDescription className={isDark ? 'text-neutral-400' : 'text-gray-500'}>
                  Exportar dados completos em Excel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className={`text-sm space-y-1 mb-4 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                  <li>• Folhas separadas por entidade</li>
                  <li>• Todos os campos de cada registo</li>
                  <li>• Formato .xlsx</li>
                </ul>
                <Button 
                  onClick={downloadExcel} 
                  disabled={downloading.excel}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                  data-testid="export-excel-btn"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {downloading.excel ? "A exportar..." : "Exportar Excel"}
                </Button>
              </CardContent>
            </Card>

            {/* Excel Import */}
            <Card className={`hover:border-orange-500/50 transition-colors ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-gray-200'}`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <Upload className="h-5 w-5 text-orange-500" />
                  Importar Excel
                </CardTitle>
                <CardDescription className={isDark ? 'text-neutral-400' : 'text-gray-500'}>
                  Importar dados a partir de ficheiro Excel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className={`text-sm space-y-1 mb-4 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                  <li>• Folhas: Equipamentos, Viaturas, Materiais, Obras</li>
                  <li>• Registos duplicados são ignorados</li>
                  <li>• Formato .xlsx ou .xls</li>
                </ul>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xlsx,.xls"
                  className="hidden"
                />
                <Button 
                  onClick={handleImportClick} 
                  disabled={uploading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-black font-semibold"
                  data-testid="import-excel-btn"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "A importar..." : "Importar Excel"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
