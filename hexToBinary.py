import json
import requests
import pyperclip

API_URL = "https://api-gateway.skymavis.com/graphql/axie-marketplace"
API_KEY = "ltmQSSuTdSLW0O0UhMNHyZz1ooKSiASE"

def hex_to_512bit_binary(hex_string: str) -> str:
    if hex_string.startswith(("0x", "0X")):
        hex_string = hex_string[2:]
    binary_str = bin(int(hex_string, 16))[2:].zfill(512)
    return binary_str[-512:]

def fetch_new_genes(axie_id: str) -> str:
    query = """
    query ($axieId: ID!) {
      axie(axieId: $axieId) {
        newGenes
      }
    }
    """
    payload = {
        "query": query,
        "variables": {"axieId": axie_id}
    }
    headers = {
        "Content-Type": "application/json",
        "X-API-KEY": API_KEY
    }

    response = requests.post(API_URL, headers=headers, json=payload, timeout=10)
    response.raise_for_status()
    data = response.json()

    if "errors" in data:
        raise RuntimeError(json.dumps(data["errors"], indent=2, ensure_ascii=False))

    new_genes = data["data"]["axie"]["newGenes"]
    if not new_genes:
        raise ValueError(f"Axie {axie_id} não possui campo 'newGenes' na resposta.")
    return new_genes

def main():
    axie_id = input("Digite o Axie ID: ").strip()
    try:
        hex_string = fetch_new_genes(axie_id)
        binary_str = hex_to_512bit_binary(hex_string)
        binary_with_commas = ",".join(binary_str)

        pyperclip.copy(binary_with_commas)
        print("[INFO] Binary string copied to clipboard.")
    except Exception as e:
        print(f"[ERROR] {e}")

if __name__ == "__main__":
    main()
