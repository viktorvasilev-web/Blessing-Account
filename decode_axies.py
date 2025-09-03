
from datetime import datetime, timedelta, timezone
import requests
import csv
import time
import json
import subprocess
from pathlib import Path
from parser import json_structure
from collections import Counter

GRAPHQL_API = "https://api-gateway.skymavis.com/graphql/axie-marketplace"
API_KEY = "9OmYe8nfDz41ntODED0ka6NGzBHkLjHP"
OWNER = '0xfda275dc5b3162fddf7a5b9b10734efc85573a46'
OUTPUT_CSV = "decoded_axies.csv"
TRIGGER_FILE = ".verceltrigger"

BATCH_SIZE_FIRST_REQUEST = 600
BATCH_SIZE_SECOND_REQUEST = 50
BATCH_DELAY_S = 0.5


def process_earned_axp_stat(earned_axp_stat):
    date_xp_pairs = []
    for date_str, entries in earned_axp_stat.items():
        try:
            total_xp = sum(entry.get("xp", 0) for entry in entries)
            date_xp_pairs.append((date_str, total_xp))
        except:
            continue
    date_xp_pairs.sort(key=lambda x: x[0])
    today = datetime.now(timezone.utc).date()
    last_two_days = []
    for i in range(2):
        day = today - timedelta(days=i)
        day_str = day.strftime('%Y-%m-%d')
        xp = next((xp for d, xp in date_xp_pairs if d == day_str), 0)
        last_two_days.append((day_str, xp))
    axp_today_str = f"Today: {last_two_days[0][1]}, Yesterday: {last_two_days[1][1]}"
    full_axp_list = [f"{d}: {xp}" for d, xp in date_xp_pairs]
    axp_18_days_str = "\n".join(full_axp_list)
    return axp_today_str, axp_18_days_str


def fetch_axie_data(owner_address=OWNER):
    from_index = 0
    all_ids = []
    while True:
        query = {
            "query": '''
                query GetAxies($owner: String!, $from: Int!, $size: Int!) {
                    axies(owner: $owner, from: $from, size: $size) {
                        results { id }
                    }
                }
            ''',
            "variables": {
                "owner": owner_address,
                "from": from_index,
                "size": BATCH_SIZE_FIRST_REQUEST
            }
        }
        try:
            response = requests.post(GRAPHQL_API, json=query, headers={
                "x-api-key": API_KEY, "Content-Type": "application/json"})
            response.raise_for_status()
            data = response.json()
            if "errors" in data:
                print(f"❌ API грешка: {data['errors']}")
                break
            ids = [axie['id'] for axie in data['data']['axies']['results']]
            all_ids.extend(ids)
            print(f"📦 Взети {len(ids)} ID-та (общо: {len(all_ids)})")
            if len(ids) < BATCH_SIZE_FIRST_REQUEST:
                break
            from_index += BATCH_SIZE_FIRST_REQUEST
            time.sleep(0.3)
        except requests.exceptions.RequestException as err:
            print(f"❌ Грешка при взимане на Axie ID-та от API: {err}")
            break

    enriched_axie_list = []
    for i in range(0, len(all_ids), BATCH_SIZE_SECOND_REQUEST):
        batch = all_ids[i:i + BATCH_SIZE_SECOND_REQUEST]
        print(f"📦 Извличаме подробности за {len(batch)} аксита...")
        try:
            data = fetch_axie_data_batch(batch)
            for j, axie_id in enumerate(batch):
                axie_data = data.get(f"axie_{j}", {})
                if not axie_data:
                    continue
                axie_id = axie_data.get("id")
                axie_class = axie_data.get("class")
                breed_count = axie_data.get("breedCount")
                purity = axie_data.get("purity")
                new_genes = axie_data.get("newGenes")
                axp_info = axie_data.get("axpInfo", {})
                delegation = axie_data.get("delegationState", {})
                try:
                    ronin = delegation["delegateeProfile"]["addresses"]["ronin"]
                except:
                    ronin = ""
                should_ascend = axp_info.get("shouldAscend")
                xp_to_ascend = axp_info.get("xpToAscend")
                level = axp_info.get("level")
                earned_axp = axie_data.get("earnedAxpStat", {})
                axp_today_str, axp_18_days_str = process_earned_axp_stat(
                    earned_axp)
                enriched_axie_list.append([
                    axie_id, axie_class, breed_count, purity, level, new_genes,
                    should_ascend, xp_to_ascend, axp_today_str, axp_18_days_str, ronin
                ])
        except Exception as err:
            print(f"❌ Грешка при извличането на данни: {err}")
        time.sleep(BATCH_DELAY_S)
    print(f"✅ Обработени всички Axie карти: {len(enriched_axie_list)}")
    return enriched_axie_list


def fetch_axie_data_batch(axie_ids):
    query = build_graphql_query(axie_ids)
    response = requests.post(GRAPHQL_API, json={"query": query}, headers={
        "x-api-key": API_KEY, "Content-Type": "application/json"})
    response.raise_for_status()
    data = response.json()
    return data.get("data", {})


def build_graphql_query(ids):
    queries = [f'''
        axie_{i}: axie(axieId: "{id}") {{
            id class breedCount purity newGenes
            earnedAxpStat(lastNDays: 18)
            delegationState {{ delegateeProfile {{ addresses {{ ronin }} }} }}
            axpInfo {{ level shouldAscend xpToAscend }}
        }}
    ''' for i, id in enumerate(ids)]
    return f"query GetAxieBatch {{ {''.join(queries)} }}"


def decode_gene_string(hex_string):
    try:
        if hex_string.startswith("0x"):
            hex_string = hex_string[2:]
        json_str = json_structure(hex_string)
        return json.loads(json_str)
    except Exception as e:
        print(f"Error decoding genes: {e}")
        return None


def generate_memento_string(axie_class, decoded_parts):
    part_classes = []
    part_keys = ['body', 'eyes', 'ears', 'mouth', 'horn', 'back', 'tail']
    for key in part_keys:
        part_data = decoded_parts.get(key)
        if isinstance(part_data, str):
            try:
                part_data = json.loads(part_data)
            except:
                continue
        if not isinstance(part_data, dict):
            continue
        dominant_data = part_data.get('d')
        if not isinstance(dominant_data, dict):
            continue
        part_class = dominant_data.get('class')
        if part_class:
            part_classes.append(part_class)
    class_counts = Counter(part_classes)
    percentages = {axie_class: 25.0}
    for cls, count in class_counts.items():
        percentages[cls] = percentages.get(cls, 0) + count * 12.5
    sorted_items = sorted(percentages.items(),
                          key=lambda x: x[1], reverse=True)
    result = ', '.join([f"{round(p, 1)}% {cls}" for cls,
                       p in sorted_items if p > 0])
    return result


def upload_csv_to_github():
    try:
        subprocess.run(["git", "config", "--global",
                       "user.email", "actions@github.com"], check=True)
        subprocess.run(["git", "config", "--global",
                       "user.name", "GitHub Actions"], check=True)
        subprocess.run(["git", "add", OUTPUT_CSV], check=True)
        subprocess.run(
            ["git", "commit", "-m", "♻️ Auto-update decoded_axies.csv"], check=True)
        subprocess.run(["git", "push"], check=True)
        print("✅ CSV файлът е push-нат успешно към GitHub")
    except subprocess.CalledProcessError as e:
        print(f"❌ Грешка при Git push: {e}")


def trigger_vercel_redeploy():
    trigger_path = Path(TRIGGER_FILE)
    try:
        trigger_path.write_text(str(datetime.utcnow()))
        subprocess.run(["git", "add", TRIGGER_FILE], check=True)
        subprocess.run(
            ["git", "commit", "-m", "🔁 Trigger Vercel redeploy"], check=True)
        subprocess.run(["git", "push"], check=True)
        print("✅ Тригер за Vercel redeploy изпратен")
    except Exception as e:
        print(f"⚠️ Неуспешно създаване на тригер файл: {e}")


def main():
    all_axies = fetch_axie_data(OWNER)
    with open(OUTPUT_CSV, mode="w", newline="", encoding="utf-8") as csvfile:
        writer = None
        first_row = True
        total_written = 0
        for axie in all_axies:
            axie_id = str(axie[0])
            axie_class = axie[1]
            breed_count = axie[2]
            purity = axie[3]
            level = axie[4]
            new_genes = axie[5]
            should_ascend = axie[6]
            xp_to_ascend = axie[7]
            axp_today = axie[8]
            axp_18days = axie[9]
            delegation = axie[10]
            decoded = decode_gene_string(new_genes)
            if decoded is None:
                print(f"⚠️ Пропуснат Axie {axie_id} - неуспешно декодиране")
                continue
            memento_string = generate_memento_string(axie_class, decoded)
            days_to_ascend = None
            try:
                if isinstance(xp_to_ascend, (int, float)):
                    days_to_ascend = round(xp_to_ascend / 10000, 1)
            except:
                pass
            base_row = {
                "ID": axie_id,
                "HyperLink": f'=HYPERLINK("https://app.axieinfinity.com/marketplace/axies/{axie_id}", "{axie_id}")',
                "Class": axie_class,
                "BreedCount": breed_count,
                "Purity": purity,
                "Level": level,
                "specialCollection": "",
                "ShouldAscend": should_ascend,
                "XpToAscend": xp_to_ascend,
                "DaysToAscend": days_to_ascend,
                "api-IDs": axie_id,
                "Memento": memento_string,
                "AXPtoday": axp_today,
                "AXP18days": axp_18days,
                "Delegation": delegation
            }
            if first_row:
                decoded_keys = [k for k in decoded.keys() if k not in (
                    "specialGenes", "specialCollection")]
                fieldnames = list(base_row.keys()) + decoded_keys
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                first_row = False
            full_row = base_row.copy()
            full_row.update(decoded)
            writer.writerow(full_row)
            total_written += 1
            print(f"✅ Записан Axie {axie_id}")
    print(f"\n📁 Данните са записани във файл: {OUTPUT_CSV}")
    upload_csv_to_github()
    trigger_vercel_redeploy()
    print(f"\nОбщо записани в CSV файла: {total_written}")


if __name__ == "__main__":
    main()
