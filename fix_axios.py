import sys

def patch_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # If import { axiosInstance } not present, add it
    if 'import { axiosInstance }' not in content:
        # replace import axios from "axios";
        content = content.replace('import axios from "axios";', 'import { axiosInstance } from "../lib/axios";\nimport axios from "axios";')

    # replace axios method calls
    content = content.replace('axios.post("/api/v1/delivery', 'axiosInstance.post("/delivery')
    content = content.replace("axios.post('/api/v1/delivery", "axiosInstance.post('/delivery")
    content = content.replace('axios.post(`/api/v1/delivery', 'axiosInstance.post(`/delivery')
    
    content = content.replace('axios.get("/api/v1/delivery', 'axiosInstance.get("/delivery')
    content = content.replace("axios.get('/api/v1/delivery", "axiosInstance.get('/delivery")
    content = content.replace('axios.get(`/api/v1/delivery', 'axiosInstance.get(`/delivery')
    
    content = content.replace('axios.put("/api/v1/delivery', 'axiosInstance.put("/delivery')
    content = content.replace("axios.put('/api/v1/delivery", "axiosInstance.put('/delivery")
    content = content.replace('axios.put(`/api/v1/delivery', 'axiosInstance.put(`/delivery')
    
    content = content.replace('axios.delete("/api/v1/delivery', 'axiosInstance.delete("/delivery')
    content = content.replace("axios.delete('/api/v1/delivery", "axiosInstance.delete('/delivery")
    content = content.replace('axios.delete(`/api/v1/delivery', 'axiosInstance.delete(`/delivery')
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Patched {file_path}")

patch_file("src/pages/DeliveryRegister.jsx")
patch_file("src/pages/DeliveryLogin.jsx")
patch_file("src/pages/DeliveryPortal.jsx")
