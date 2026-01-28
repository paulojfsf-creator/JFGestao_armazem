import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft, Building2, Wrench, Truck, Package, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const estadoLabels = { Ativa: "Ativa", Concluida: "Concluída", Pausada: "Pausada" };

export default function ObraDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [obraData, setObraData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchObraRecursos();
  }, [id]);

  const fetchObraRecursos = async () => {
    try {
      const response = await axios.get(`${API}/obras/${id}/recursos`, {
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

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-slate-500">A carregar...</div></div>;
  if (!obraData) return null;

  return (
    <div data-testid="obra-detail-page">
      <div className="page-header">
        <Button variant="ghost" onClick={() => navigate("/obras")} className="mb-4" data-testid="back-btn">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar às Obras
        </Button>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="page-title flex items-center gap-3">
              <Building2 className="h-8 w-8 text-amber-500" />
              {obraData.obra.nome}
            </h1>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">{obraData.obra.codigo}</span>
              <span className={`badge ${obraData.obra.estado === "Ativa" ? "status-available" : obraData.obra.estado === "Pausada" ? "status-maintenance" : "status-completed"}`}>
                {estadoLabels[obraData.obra.estado]}
              </span>
              {obraData.obra.endereco && <span className="text-slate-500 text-sm">{obraData.obra.endereco}</span>}
              {obraData.obra.cliente && <span className="text-slate-500 text-sm">Cliente: {obraData.obra.cliente}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Locais associados */}
      <Card className="mb-6 border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-amber-500" />
            Locais Associados
            <span className="ml-auto text-sm font-normal text-slate-500">{obraData.locais?.length || 0}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {obraData.locais?.length === 0 ? (
            <p className="text-slate-400 text-sm">Nenhum local associado a esta obra</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {obraData.locais.map((local) => (
                <span key={local.id} className="bg-slate-100 px-3 py-1 rounded-sm text-sm">
                  {local.codigo} - {local.nome}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recursos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-200" data-testid="equipamentos-section">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wrench className="h-5 w-5 text-amber-500" />
              Equipamentos
              <span className="ml-auto text-sm font-normal text-slate-500">{obraData.equipamentos?.length || 0}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {obraData.equipamentos?.length === 0 ? (
              <p className="text-slate-400 text-sm">Nenhum equipamento</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {obraData.equipamentos.map((item) => (
                  <li key={item.id} className="bg-slate-50 px-3 py-2 rounded-sm">
                    <span className="font-mono text-xs text-slate-400">{item.codigo}</span>
                    <p className="text-sm font-medium">{item.descricao}</p>
                    <p className="text-xs text-slate-500">{item.marca} {item.modelo}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200" data-testid="viaturas-section">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Truck className="h-5 w-5 text-amber-500" />
              Viaturas
              <span className="ml-auto text-sm font-normal text-slate-500">{obraData.viaturas?.length || 0}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {obraData.viaturas?.length === 0 ? (
              <p className="text-slate-400 text-sm">Nenhuma viatura</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {obraData.viaturas.map((item) => (
                  <li key={item.id} className="bg-slate-50 px-3 py-2 rounded-sm">
                    <span className="font-mono text-sm font-medium">{item.matricula}</span>
                    <p className="text-xs text-slate-500">{item.marca} {item.modelo}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200" data-testid="materiais-section">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-amber-500" />
              Materiais
              <span className="ml-auto text-sm font-normal text-slate-500">{obraData.materiais?.length || 0}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {obraData.materiais?.length === 0 ? (
              <p className="text-slate-400 text-sm">Nenhum material</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {obraData.materiais.map((item) => (
                  <li key={item.id} className="bg-slate-50 px-3 py-2 rounded-sm">
                    <span className="font-mono text-xs text-slate-400">{item.codigo}</span>
                    <p className="text-sm font-medium">{item.descricao}</p>
                    <p className="text-xs text-slate-500">Stock: {item.stock_atual} {item.unidade}</p>
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
