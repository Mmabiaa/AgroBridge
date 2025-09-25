const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export async function getHello() {
  const res = await fetch(`${API_URL}/`);
  if (!res.ok) throw new Error("API error");
  return res.json();
}

export async function getProducts() {
  const res = await fetch(`${API_URL}/products/`);
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

export async function createProduct(product: any) {
  const res = await fetch(`${API_URL}/products/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });
  if (!res.ok) throw new Error("Failed to create product");
  return res.json();
} 