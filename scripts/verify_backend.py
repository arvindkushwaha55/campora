#!/usr/bin/env python3
"""API-level verification of Campora's Supabase backend: auth, trigger,
RLS on profiles/posts, and storage folder policies. Uses two test users.

Configuration comes from environment variables (never commit real values):
  CAMPORA_SUPABASE_URL        e.g. https://your-project-ref.supabase.co
  CAMPORA_SUPABASE_ANON_KEY   the project's anon/public key
  CAMPORA_TEST_PASSWORD       password for the two throwaway test accounts
"""
import json, os, urllib.request, urllib.error, sys

BASE = os.environ.get("CAMPORA_SUPABASE_URL", "").rstrip("/")
ANON = os.environ.get("CAMPORA_SUPABASE_ANON_KEY", "")
PW = os.environ.get("CAMPORA_TEST_PASSWORD", "")
if not (BASE and ANON and PW):
    sys.exit("Set CAMPORA_SUPABASE_URL, CAMPORA_SUPABASE_ANON_KEY and CAMPORA_TEST_PASSWORD first.")
results = []

def call(method, path, token=None, body=None, headers=None, raw=None):
    url = BASE + path
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("apikey", ANON)
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    if body is not None:
        req.add_header("Content-Type", "application/json")
    for k, v in (headers or {}).items():
        req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            txt = r.read().decode()
            return r.status, (json.loads(txt) if txt.strip().startswith(("[", "{")) else txt)
    except urllib.error.HTTPError as e:
        txt = e.read().decode()
        try:
            return e.code, json.loads(txt)
        except Exception:
            return e.code, txt

def check(name, ok, detail=""):
    results.append((name, ok, detail))
    print(f"{'PASS' if ok else 'FAIL'}  {name}  {detail}")

def signup(email, name, course, year):
    s, b = call("POST", "/auth/v1/signup", body={"email": email, "password": PW,
                "data": {"full_name": name, "course": course, "year": year}})
    return s, b

# --- Signup user A ---
s, a = signup("test.a@campora.test", "Test Student A", "B.Tech", "2nd")
check("Signup A returns session (confirm email OFF)", s == 200 and bool(a.get("access_token")), f"status={s}")
tokA, idA = a.get("access_token"), a.get("user", {}).get("id")

# --- Signup user B ---
s, b = signup("test.b@campora.test", "Test Student B", "BCA", "1st")
check("Signup B returns session", s == 200 and bool(b.get("access_token")), f"status={s}")
tokB, idB = b.get("access_token"), b.get("user", {}).get("id")

# --- Trigger created A's profile with metadata ---
s, rows = call("GET", f"/rest/v1/profiles?id=eq.{idA}", token=tokA)
ok = s == 200 and rows and rows[0]["full_name"] == "Test Student A" and rows[0]["course"] == "B.Tech" and rows[0]["year"] == "2nd"
check("Profile auto-created by trigger with name/course/year", bool(ok), f"rows={rows}")

# --- Login with correct + wrong password ---
s, li = call("POST", "/auth/v1/token?grant_type=password", body={"email": "test.a@campora.test", "password": PW})
check("Login A with correct password", s == 200 and bool(li.get("access_token")), f"status={s}")
s, li2 = call("POST", "/auth/v1/token?grant_type=password", body={"email": "test.a@campora.test", "password": "wrong-pass"})
check("Login A with WRONG password rejected", s == 400, f"status={s}")

# --- A creates a post ---
s, post = call("POST", "/rest/v1/posts", token=tokA, body={"user_id": idA, "text": "Hello from Test A"},
               headers={"Prefer": "return=representation"})
post_id = post[0]["id"] if s in (200, 201) and post else None
check("A creates post", post_id is not None, f"status={s} post={post}")

# --- B can read the feed and sees A's post with author profile ---
s, feed = call("GET", "/rest/v1/posts?select=id,text,profiles(full_name)", token=tokB)
ok = s == 200 and any(p["id"] == post_id and p["profiles"]["full_name"] == "Test Student A" for p in feed)
check("B reads feed, sees A's post + author name", bool(ok), f"status={s} feed={feed}")

# --- B tries to impersonate: insert a post AS A ---
s, imp = call("POST", "/rest/v1/posts", token=tokB, body={"user_id": idA, "text": "impersonated"},
              headers={"Prefer": "return=representation"})
check("B CANNOT create a post as A (RLS)", s in (401, 403), f"status={s} body={imp}")

# --- B tries to delete A's post ---
call("DELETE", f"/rest/v1/posts?id=eq.{post_id}", token=tokB)
s, still = call("GET", f"/rest/v1/posts?id=eq.{post_id}", token=tokA)
check("B CANNOT delete A's post (still exists)", s == 200 and len(still) == 1, f"remaining={still}")

# --- B tries to edit A's profile ---
call("PATCH", f"/rest/v1/profiles?id=eq.{idA}", token=tokB, body={"full_name": "Hacked Name"},
     headers={"Prefer": "return=representation"})
s, prof = call("GET", f"/rest/v1/profiles?id=eq.{idA}", token=tokA)
check("B CANNOT edit A's profile (name unchanged)", bool(prof) and prof[0]["full_name"] == "Test Student A", f"profile={prof}")

# --- A edits own profile ---
s, upd = call("PATCH", f"/rest/v1/profiles?id=eq.{idA}", token=tokA, body={"year": "3rd"},
              headers={"Prefer": "return=representation"})
check("A CAN edit own profile", s == 200 and upd and upd[0]["year"] == "3rd", f"status={s} upd={upd}")

# --- Storage: A uploads avatar to own folder; B cannot write into A's folder ---
png = bytes.fromhex("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6360000000020001e221bc330000000049454e44ae426082")
s, up = call("POST", f"/storage/v1/object/avatars/{idA}/avatar.png", token=tokA, raw=png,
             headers={"Content-Type": "image/png"})
check("A uploads avatar to OWN folder", s == 200, f"status={s} body={up}")
s, up2 = call("POST", f"/storage/v1/object/avatars/{idA}/evil.png", token=tokB, raw=png,
              headers={"Content-Type": "image/png"})
check("B CANNOT upload into A's avatar folder", s in (400, 401, 403), f"status={s} body={up2}")
s, up3 = call("POST", f"/storage/v1/object/post-images/{idA}/photo.png", token=tokA, raw=png,
              headers={"Content-Type": "image/png"})
check("A uploads image to OWN post-images folder", s == 200, f"status={s}")

# --- Anonymous (no login) cannot read posts ---
s, anonfeed = call("GET", "/rest/v1/posts")
check("Signed-out visitor CANNOT read posts", s == 200 and anonfeed == [], f"status={s} body={anonfeed}")

# --- A deletes own post ---
call("DELETE", f"/rest/v1/posts?id=eq.{post_id}", token=tokA)
s, gone = call("GET", f"/rest/v1/posts?id=eq.{post_id}", token=tokA)
check("A CAN delete own post (now gone)", s == 200 and gone == [], f"remaining={gone}")

print()
failed = [r for r in results if not r[1]]
print(f"TOTAL: {len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
