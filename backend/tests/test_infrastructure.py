"""
Basic infrastructure tests to verify testing framework is working.
These tests don't require Django or database setup.
"""
import pytest


@pytest.mark.unit
def test_pytest_working():
    """Verify pytest is working."""
    assert True


@pytest.mark.unit
def test_basic_math():
    """Test basic assertions."""
    assert 1 + 1 == 2
    assert 2 * 3 == 6


@pytest.mark.unit
def test_string_operations():
    """Test string operations."""
    text = "AgroBridge"
    assert text.lower() == "agrobridge"
    assert len(text) == 10


@pytest.mark.unit
class TestInfrastructure:
    """Test class for infrastructure validation."""
    
    def test_list_operations(self):
        """Test list operations."""
        items = [1, 2, 3, 4, 5]
        assert len(items) == 5
        assert sum(items) == 15
    
    def test_dict_operations(self):
        """Test dictionary operations."""
        data = {"name": "AgroBridge", "version": "1.0"}
        assert data["name"] == "AgroBridge"
        assert "version" in data
    
    def test_exception_handling(self):
        """Test exception handling."""
        with pytest.raises(ValueError):
            raise ValueError("Test error")


@pytest.mark.smoke
def test_smoke_check():
    """Quick smoke test."""
    assert True


@pytest.mark.unit
def test_fixtures_available(tmp_path):
    """Test that pytest fixtures are available."""
    # tmp_path is a built-in pytest fixture
    assert tmp_path.exists()
    
    # Create a test file
    test_file = tmp_path / "test.txt"
    test_file.write_text("Hello AgroBridge")
    
    assert test_file.read_text() == "Hello AgroBridge"


@pytest.mark.unit
@pytest.mark.parametrize("input,expected", [
    (1, 2),
    (2, 4),
    (3, 6),
    (4, 8),
])
def test_parametrized(input, expected):
    """Test parametrized tests."""
    assert input * 2 == expected


@pytest.mark.unit
def test_markers_working():
    """Verify test markers are working."""
    # This test itself verifies markers work
    assert hasattr(pytest.mark, 'unit')
    assert hasattr(pytest.mark, 'integration')
    assert hasattr(pytest.mark, 'e2e')


@pytest.mark.performance
def test_performance_marker():
    """Test with performance marker."""
    # Simple performance test
    result = sum(range(1000))
    assert result == 499500
