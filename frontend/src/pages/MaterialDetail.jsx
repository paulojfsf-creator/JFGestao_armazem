import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth, useTheme, API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Package, 
  Calendar, 
  Hash,
  ArrowUpDown,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MaterialDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const isDark = theme === "dark";

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API}/materiais/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
    } catch (error) {
      toast.error("Material não encontrado");
      navigate("/materiais");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
        A carregar...
      </div>
    );
  }

  const { material, historico } = data;
  const lowStock = material.stock_atual <= material.stock_minimo && material.stock_minimo > 0;

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div data-testid="material-detail-page" className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/materiais")}
          className={isDark ? 'text-neutral-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}
          data-testid="back-btn"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Info Card */}
        <div className="flex-1">
          <Card className={isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-gray-200'}>
            <CardHeader className={`border-b ${isDark ? 'border-neutral-700' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`h-16 w-16 rounded-lg flex items-center justify-center ${isDark ? 'bg-neutral-700' : 'bg-gray-100'}`}>
                    <Package className={`h-8 w-8 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <CardTitle className={`text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>{material.descricao}</CardTitle>
                    <p className={`font-mono text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>{material.codigo}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={material.ativo ? "default" : "secondary"} className={material.ativo ? "bg-emerald-500/20 text-emerald-500" : `${isDark ? 'bg-neutral-600 text-neutral-400' : 'bg-gray-200 text-gray-500'}`}>
                        {material.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                      {lowStock && (
                        <Badge className="bg-red-500/20 text-red-500">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Stock Baixo
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className={`p-4 rounded-lg ${isDark ? 'bg-neutral-700/50' : 'bg-gray-50'}`}>
                  <p className={`text-sm mb-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Stock Atual</p>
                  <p className={`text-3xl font-bold ${lowStock ? 'text-red-500' : isDark ? 'text-white' : 'text-gray-900'}`}>
                    {material.stock_atual}
                    <span className={`text-base font-normal ml-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>{material.unidade}</span>
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-neutral-700/50' : 'bg-gray-50'}`}>
                  <p className={`text-sm mb-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Stock Mínimo</p>
                  <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {material.stock_minimo}
                    <span className={`text-base font-normal ml-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>{material.unidade}</span>
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className={`flex items-center gap-3 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                  <Hash className="h-4 w-4 text-orange-500" />
                  <span className={isDark ? 'text-neutral-500' : 'text-gray-500'}>Unidade:</span>
                  <span>{material.unidade}</span>
                </div>
                <div className={`flex items-center gap-3 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                  <Calendar className="h-4 w-4 text-orange-500" />
                  <span className={isDark ? 'text-neutral-500' : 'text-gray-500'}>Criado em:</span>
                  <span>{formatDate(material.created_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Histórico de Movimentos */}
        <div className="lg:w-96">
          <Card className={isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-gray-200'}>
            <CardHeader>
              <CardTitle className={`text-lg flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <ArrowUpDown className="h-5 w-5 text-orange-500" />
                Histórico de Movimentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historico && historico.length > 0 ? (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {historico.map((mov, idx) => (
                    <div 
                      key={mov.id || idx}
                      className={`p-4 rounded-lg border ${mov.tipo_movimento === "Entrada" ? "bg-emerald-500/10 border-emerald-500/30" : "bg-amber-500/10 border-amber-500/30"}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={mov.tipo_movimento === "Entrada" ? "bg-emerald-500/20 text-emerald-500" : "bg-amber-500/20 text-amber-500"}>
                          {mov.tipo_movimento}
                        </Badge>
                        <span className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>{formatDate(mov.data_hora)}</span>
                      </div>
                      <p className={`text-lg font-bold ${mov.tipo_movimento === "Entrada" ? "text-emerald-500" : "text-amber-500"}`}>
                        {mov.tipo_movimento === "Entrada" ? "+" : "-"}{mov.quantidade} {material.unidade}
                      </p>
                      {mov.responsavel && (
                        <p className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                          Por: {mov.responsavel}
                        </p>
                      )}
                      {mov.observacoes && (
                        <p className={`text-xs mt-2 italic ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>"{mov.observacoes}"</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`text-center py-8 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
                  <ArrowUpDown className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Sem movimentos registados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
