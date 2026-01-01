import requests
import socket
import requests.packages.urllib3.util.connection as urllib3_cn

def force_ipv4():
    def allowed_gai_family():
        return socket.AF_INET  # force IPv4
    urllib3_cn.allowed_gai_family = allowed_gai_family

force_ipv4()

url = "https://nominatim.openstreetmap.org/reverse"
params = {
    "lat": 25.276381,
    "lon": 55.368653,
    "format": "json"
}
headers = {
    "User-Agent": "GeoStatResearch/1.0",
    "Accept": "application/json"
}

r = requests.get(url, params=params, headers=headers, timeout=10)
print(r.status_code)
print(r.json())