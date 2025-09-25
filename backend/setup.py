from setuptools import setup, find_packages

setup(
    name="agrobridge-backend",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "fastapi==0.95.2",
        "uvicorn[standard]==0.22.0",
        "sqlalchemy==2.0.23",
        "pydantic==1.10.13",
        "python-jose[cryptography]==3.3.0",
        "passlib[bcrypt]==1.7.4",
        "python-multipart==0.0.6",
        "python-dotenv==1.0.0",
        "alembic==1.12.1",
    ],
    extras_require={
        "dev": [
            "pytest==7.4.4",
            "pytest-cov==4.1.0",
            "httpx==0.24.1",
        ],
    },
    python_requires=">=3.8",
)
