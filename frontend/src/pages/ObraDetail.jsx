import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft, Building2, Wrench, Truck, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const estadoLabels = { Ativa: "Ativa", Concluida: "Concluída", Pausada: "Pausada" };

export default function ObraDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [obraData, setObraData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchObraData();
  }, [id]);

  const fetchObraData = async () => {
    try {
      const response = await axios.get(`${API}/obras/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setObraData(response.data);
    } catch (error) {
      toast.error("Erro ao carregar dados da obra");
      navigate("/obras");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-neutral-400">A carregar...</div></div>;
  if (!obraData) return null;

  const { obra, equipamentos, viaturas } = obraData;

  return (
    <div data-testid="obra-detail-page" className="animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/obras")}
          className="text-neutral-400 hover:text-white"
          data-testid="back-btn"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      {/* Obra Header */}
      <Card className="bg-neutral-800 border-neutral-700 mb-6">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="h-8 w-8 text-orange-500" />
                <CardTitle className="text-2xl text-white">{obra.nome}</CardTitle>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono text-sm bg-neutral-700 px-2 py-1 rounded text-orange-400">{obra.codigo}</span>
                <Badge className={`${obra.estado === "Ativa" ? "bg-emerald-500/20 text-emerald-400" : obra.estado === "Pausada" ? "bg-amber-500/20 text-amber-400" : "bg-neutral-500/20 text-neutral-400"}`}>
                  {estadoLabels[obra.estado]}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {obra.endereco && (
              <div>
                <span className="text-neutral-500">Endereço:</span>
                <p className="text-neutral-300">{obra.endereco}</p>
              </div>
            )}
            {obra.cliente && (
              <div>
                <span className="text-neutral-500">Cliente:</span>
                <p className="text-neutral-300">{obra.cliente}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recursos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Equipamentos */}
        <Card className="bg-neutral-800 border-neutral-700" data-testid="equipamentos-section">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              <Wrench className="h-5 w-5 text-orange-500" />
              Equipamentos
              <span className="ml-auto text-sm font-normal text-neutral-500">{equipamentos?.length || 0}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {equipamentos?.length === 0 ? (
              <p className="text-neutral-500 text-sm">Nenhum equipamento atribuído a esta obra</p>
            ) : (
              <ul className="space-y-2 max-h-80 overflow-y-auto">
                {equipamentos.map((item) => (
                  <li key={item.id} className="bg-neutral-700/50 px-3 py-3 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs text-orange-400">{item.codigo}</span>
                      <p className="text-sm font-medium text-white">{item.descricao}</p>
                      <p className="text-xs text-neutral-400">{item.marca} {item.modelo}</p>
                    </div>
                    <Link to={`/equipamentos/${item.id}`}>
                      <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Viaturas */}
        <Card className="bg-neutral-800 border-neutral-700" data-testid="viaturas-section">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              <Truck className="h-5 w-5 text-orange-500" />
              Viaturas
              <span className="ml-auto text-sm font-normal text-neutral-500">{viaturas?.length || 0}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {viaturas?.length === 0 ? (
              <p className="text-neutral-500 text-sm">Nenhuma viatura atribuída a esta obra</p>
            ) : (
              <ul className="space-y-2 max-h-80 overflow-y-auto">
                {viaturas.map((item) => (
                  <li key={item.id} className="bg-neutral-700/50 px-3 py-3 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="font-mono text-sm font-bold text-orange-400">{item.matricula}</span>
                      <p className="text-xs text-neutral-400">{item.marca} {item.modelo}</p>
                    </div>
                    <Link to={`/viaturas/${item.id}`}>
                      <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
