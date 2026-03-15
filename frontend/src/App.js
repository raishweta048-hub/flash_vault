import React, { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [products, setProducts] = useState([]);

  const fetchProducts = async () => {
    const res = await axios.get("http://localhost:5000/api/products");
    setProducts(res.data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const buyProduct = async (id) => {
    try {
      await axios.post(`http://localhost:5000/api/products/buy/${id}`);
      alert("Purchase successful!");
      fetchProducts();
    } catch (err) {
      alert("Sold Out or Error");
    }
  };

  return (
    <div style={{padding:"40px"}}>
      <h1>FlashVault ⚡ Flash Sale</h1>

      {products.map((p) => (
        <div key={p._id} style={{border:"1px solid gray",padding:"20px",margin:"20px"}}>
          <h2>{p.name}</h2>
          <p>{p.description}</p>
          <p>Price: ₹{p.price}</p>
          <p>Stock: {p.stock}</p>

          <button
            onClick={() => buyProduct(p._id)}
            disabled={p.stock === 0}
          >
            {p.stock === 0 ? "Sold Out" : "Buy Now"}
          </button>
        </div>
      ))}
    </div>
  );
}

export default App;