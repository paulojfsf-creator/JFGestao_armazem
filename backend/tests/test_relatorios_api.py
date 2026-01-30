"""
Tests for Advanced Reports API endpoints
Tests: /api/relatorios/movimentos, /api/relatorios/stock, /api/relatorios/obra/{obra_id}
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://buildstock-hub.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "test@test.com"
TEST_PASSWORD = "test123"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for tests"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code != 200:
        pytest.skip("Authentication failed - cannot proceed with tests")
    return response.json()["access_token"]


@pytest.fixture(scope="module")
def obra_id(auth_token):
    """Get an existing obra ID for testing"""
    response = requests.get(f"{BASE_URL}/api/obras", headers={
        "Authorization": f"Bearer {auth_token}"
    })
    if response.status_code == 200:
        obras = response.json()
        if obras:
            return obras[0]["id"]
    return None


class TestRelatoriosMovimentos:
    """Tests for /api/relatorios/movimentos endpoint"""
    
    def test_relatorio_movimentos_no_filters(self, auth_token):
        """Test getting movements report without filters"""
        response = requests.get(f"{BASE_URL}/api/relatorios/movimentos", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Validate response structure
        assert "movimentos" in data
        assert "estatisticas" in data
        assert isinstance(data["movimentos"], list)
        
        # Validate statistics structure
        stats = data["estatisticas"]
        assert "total_movimentos" in stats
        assert "total_saidas" in stats
        assert "total_devolucoes" in stats
        assert "equipamentos_movidos" in stats
        assert "viaturas_movidas" in stats
        print(f"✓ Relatorio movimentos (no filters): {stats['total_movimentos']} movimentos")
    
    def test_relatorio_movimentos_with_ano(self, auth_token):
        """Test getting movements report filtered by year"""
        response = requests.get(f"{BASE_URL}/api/relatorios/movimentos?ano=2026", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "movimentos" in data
        assert "estatisticas" in data
        print(f"✓ Relatorio movimentos (ano=2026): {data['estatisticas']['total_movimentos']} movimentos")
    
    def test_relatorio_movimentos_with_mes_ano(self, auth_token):
        """Test getting movements report filtered by month and year"""
        response = requests.get(f"{BASE_URL}/api/relatorios/movimentos?mes=1&ano=2026", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "movimentos" in data
        assert "estatisticas" in data
        print(f"✓ Relatorio movimentos (mes=1, ano=2026): {data['estatisticas']['total_movimentos']} movimentos")
    
    def test_relatorio_movimentos_with_obra_id(self, auth_token, obra_id):
        """Test getting movements report filtered by obra"""
        if not obra_id:
            pytest.skip("No obra available for testing")
        
        response = requests.get(f"{BASE_URL}/api/relatorios/movimentos?obra_id={obra_id}&ano=2026", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "movimentos" in data
        assert "estatisticas" in data
        print(f"✓ Relatorio movimentos (obra_id filter): {data['estatisticas']['total_movimentos']} movimentos")
    
    def test_relatorio_movimentos_enriched_data(self, auth_token):
        """Test that movements are enriched with resource and obra details"""
        response = requests.get(f"{BASE_URL}/api/relatorios/movimentos?ano=2026", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        
        if data["movimentos"]:
            mov = data["movimentos"][0]
            # Check enriched fields exist (may be empty if no resource found)
            assert "tipo_recurso" in mov
            assert "tipo_movimento" in mov
            print(f"✓ Movimentos enriched with resource details")


class TestRelatoriosStock:
    """Tests for /api/relatorios/stock endpoint"""
    
    def test_relatorio_stock_no_filters(self, auth_token):
        """Test getting stock report without filters"""
        response = requests.get(f"{BASE_URL}/api/relatorios/stock", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Validate response structure
        assert "movimentos" in data
        assert "estatisticas" in data
        assert "materiais_resumo" in data
        assert isinstance(data["movimentos"], list)
        assert isinstance(data["materiais_resumo"], list)
        
        # Validate statistics structure
        stats = data["estatisticas"]
        assert "total_movimentos" in stats
        assert "total_entradas" in stats
        assert "total_saidas" in stats
        assert "consumo_liquido" in stats
        assert "materiais_diferentes" in stats
        print(f"✓ Relatorio stock (no filters): {stats['total_movimentos']} movimentos")
    
    def test_relatorio_stock_with_ano(self, auth_token):
        """Test getting stock report filtered by year"""
        response = requests.get(f"{BASE_URL}/api/relatorios/stock?ano=2026", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "movimentos" in data
        assert "estatisticas" in data
        assert "materiais_resumo" in data
        print(f"✓ Relatorio stock (ano=2026): {data['estatisticas']['total_movimentos']} movimentos")
    
    def test_relatorio_stock_with_obra_id(self, auth_token, obra_id):
        """Test getting stock report filtered by obra"""
        if not obra_id:
            pytest.skip("No obra available for testing")
        
        response = requests.get(f"{BASE_URL}/api/relatorios/stock?obra_id={obra_id}&ano=2026", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "movimentos" in data
        assert "estatisticas" in data
        print(f"✓ Relatorio stock (obra_id filter): {data['estatisticas']['total_movimentos']} movimentos")


class TestRelatoriosObra:
    """Tests for /api/relatorios/obra/{obra_id} endpoint"""
    
    def test_relatorio_obra_basic(self, auth_token, obra_id):
        """Test getting obra-specific report"""
        if not obra_id:
            pytest.skip("No obra available for testing")
        
        response = requests.get(f"{BASE_URL}/api/relatorios/obra/{obra_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Validate response structure
        assert "obra" in data
        assert "estatisticas" in data
        assert "recursos_atuais" in data
        assert "consumo_materiais" in data
        
        # Validate obra data
        assert "nome" in data["obra"]
        assert "codigo" in data["obra"]
        
        # Validate statistics structure
        stats = data["estatisticas"]
        assert "equipamentos_atuais" in stats
        assert "viaturas_atuais" in stats
        assert "movimentos_ativos" in stats
        assert "movimentos_stock" in stats
        assert "total_saidas_ativos" in stats
        assert "total_devolucoes" in stats
        
        # Validate recursos_atuais structure
        recursos = data["recursos_atuais"]
        assert "equipamentos" in recursos
        assert "viaturas" in recursos
        assert isinstance(recursos["equipamentos"], list)
        assert isinstance(recursos["viaturas"], list)
        
        print(f"✓ Relatorio obra: {data['obra']['nome']} - {stats['equipamentos_atuais']} equipamentos, {stats['viaturas_atuais']} viaturas")
    
    def test_relatorio_obra_with_ano(self, auth_token, obra_id):
        """Test getting obra report filtered by year"""
        if not obra_id:
            pytest.skip("No obra available for testing")
        
        response = requests.get(f"{BASE_URL}/api/relatorios/obra/{obra_id}?ano=2026", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "obra" in data
        assert "estatisticas" in data
        print(f"✓ Relatorio obra (ano=2026): {data['obra']['nome']}")
    
    def test_relatorio_obra_with_mes_ano(self, auth_token, obra_id):
        """Test getting obra report filtered by month and year"""
        if not obra_id:
            pytest.skip("No obra available for testing")
        
        response = requests.get(f"{BASE_URL}/api/relatorios/obra/{obra_id}?mes=1&ano=2026", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "obra" in data
        assert "estatisticas" in data
        print(f"✓ Relatorio obra (mes=1, ano=2026): {data['obra']['nome']}")
    
    def test_relatorio_obra_not_found(self, auth_token):
        """Test getting report for non-existent obra"""
        response = requests.get(f"{BASE_URL}/api/relatorios/obra/non-existent-id", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 404
        print("✓ Non-existent obra returns 404")


class TestRelatoriosAuth:
    """Tests for authentication on report endpoints"""
    
    def test_relatorio_movimentos_no_auth(self):
        """Test that movimentos report requires authentication"""
        response = requests.get(f"{BASE_URL}/api/relatorios/movimentos")
        assert response.status_code in [401, 403]
        print("✓ Relatorio movimentos requires authentication")
    
    def test_relatorio_stock_no_auth(self):
        """Test that stock report requires authentication"""
        response = requests.get(f"{BASE_URL}/api/relatorios/stock")
        assert response.status_code in [401, 403]
        print("✓ Relatorio stock requires authentication")
    
    def test_relatorio_obra_no_auth(self):
        """Test that obra report requires authentication"""
        response = requests.get(f"{BASE_URL}/api/relatorios/obra/some-id")
        assert response.status_code in [401, 403]
        print("✓ Relatorio obra requires authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
