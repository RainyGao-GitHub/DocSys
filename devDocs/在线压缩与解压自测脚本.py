# -*- coding: utf-8 -*-
# 在线压缩与解压 P0 后端自测（urlencoded 表单，避免 multipart 编码坑）
import json, time, base64, urllib.request, urllib.parse, http.cookiejar, os, sys

BASE = 'http://127.0.0.1:8100/DocSystem'
RDATA = r'C:/DocSysReposes/23/data/rdata'
cj = http.cookiejar.MozillaCookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

def post(path, data):
    req = urllib.request.Request(BASE + path, data=urllib.parse.urlencode(data).encode('utf-8'))
    with opener.open(req, timeout=60) as r:
        return json.loads(r.read().decode('utf-8'))

def poll(taskId, maxWait=90):
    for i in range(maxWait // 2):
        time.sleep(2)
        d = post('/Doc/queryCompressExtractTask.do', {'taskId': taskId})
        if d.get('msgData') != 5:
            return d
    return {'status': 'timeout'}

def tree(rel=''):
    out = []
    root = os.path.join(RDATA, rel)
    for dp, ds, fs in os.walk(root):
        for f in fs:
            out.append(os.path.join(dp, f).replace(RDATA, '').replace('\\', '/'))
    return sorted(out)

PASS, FAIL = [], []
def check(name, cond, detail=''):
    (PASS if cond else FAIL).append((name, detail))
    print(('PASS ' if cond else 'FAIL ') + name + ('  | ' + detail if detail and not cond else ''))

# 登录 Admin
d = post('/User/login.do', {'userName': 'Admin', 'pwd': base64.b64encode('Admin'.encode()).decode()})
check('登录', d.get('status') == 'ok')

# ===== T1 提取到子目录（方案B）=====
d = post('/Doc/extractDocPrepare.do', {'reposId': 23, 'path': '/', 'name': 'test-a.zip', 'targetPath': '/', 'targetName': 'pkgA'})
check('T1 prepare msgData=5', d.get('msgData') == 5, str(d)[:150])
r = poll(d['data']['id'])
check('T1 完成', r.get('status') == 'ok', str(r)[:200])
t = tree()
expect = ['/bulk.zip', '/pkgA/顶层目录/子目录/文件2.txt', '/pkgA/顶层目录/中文文档.md', '/pkgA/顶层目录/文件1.txt', '/test-a.zip']
check('T1 文件树(方案B不散落)', t == sorted(expect), str(t))

# ===== T2 冲突预检 =====
d = post('/Doc/extractDocPrepare.do', {'reposId': 23, 'path': '/', 'name': 'test-a.zip', 'targetPath': '/', 'targetName': 'pkgA'})
check('T2 冲突返回conflict', d.get('msgData') == 'conflict' and d['data']['count'] == 1 and d['data']['names'] == ['pkgA'], str(d)[:200])

# ===== T3 overwrite=1 覆盖重提 =====
d = post('/Doc/extractDocPrepare.do', {'reposId': 23, 'path': '/', 'name': 'test-a.zip', 'targetPath': '/', 'targetName': 'pkgA', 'overwriteFlag': 1})
check('T3 prepare msgData=5', d.get('msgData') == 5, str(d)[:150])
r = poll(d['data']['id'])
check('T3 覆盖完成', r.get('status') == 'ok', str(r)[:200])
check('T3 文件数不变(合并)', len(tree()) == 5, str(tree()))

# ===== T4 散装包散落提取 + 冲突 =====
d = post('/Doc/extractDocPrepare.do', {'reposId': 23, 'path': '/', 'name': 'bulk.zip', 'targetPath': '/', 'targetName': '', 'overwriteFlag': 1})
check('T4a 首次散落提取', d.get('msgData') == 5, str(d)[:200])
r = poll(d['data']['id'])
check('T4a 散落提取完成', r.get('status') == 'ok', str(r)[:200])
t = tree()
check('T4a 散落文件树', '/readme.txt' in t and '/data/notes.txt' in t, str(t))
d = post('/Doc/extractDocPrepare.do', {'reposId': 23, 'path': '/', 'name': 'bulk.zip', 'targetPath': '/', 'targetName': ''})
check('T4b 散装冲突conflict', d.get('msgData') == 'conflict' and d['data']['names'] == ['readme.txt', 'data'], str(d)[:250])
d = post('/Doc/extractDocPrepare.do', {'reposId': 23, 'path': '/', 'name': 'bulk.zip', 'targetPath': '/', 'targetName': '', 'overwriteFlag': 1})
r = poll(d['data']['id'])
check('T4b 覆盖散落提取完成', r.get('status') == 'ok', str(r)[:200])

# ===== T5 entryList 部分提取（zipViewer 场景）=====
d = post('/Doc/extractDocPrepare.do', {'reposId': 23, 'path': '/', 'name': 'test-a.zip', 'targetPath': '/', 'targetName': '', 'entryList': json.dumps(['顶层目录/子目录'])})
check('T5 无冲突直接执行', d.get('msgData') == 5, str(d)[:200])
r = poll(d['data']['id'])
check('T5 部分提取完成', r.get('status') == 'ok', str(r)[:200])
check('T5 只提取子目录', '/顶层目录/子目录/文件2.txt' in tree() and '/顶层目录/文件1.txt' not in tree(), str(tree()))

# ===== T6 普通用户权限拒绝（test 用户对仓库23无权限）=====
cj2 = http.cookiejar.MozillaCookieJar()
op2 = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj2))
req = urllib.request.Request(BASE + '/User/login.do', data=urllib.parse.urlencode({'userName': 'test', 'pwd': base64.b64encode('test'.encode()).decode()}).encode())
op2.open(req, timeout=30)
req = urllib.request.Request(BASE + '/Doc/extractDocPrepare.do', data=urllib.parse.urlencode({'reposId': 23, 'path': '/', 'name': 'test-a.zip', 'targetPath': '/', 'targetName': 'x'}).encode())
d = json.loads(op2.open(req, timeout=30).read().decode('utf-8'))
check('T6 提取权限拒绝', d.get('status') == 'fail', str(d)[:150])
req = urllib.request.Request(BASE + '/Doc/compressDocPrepare.do', data=urllib.parse.urlencode({'reposId': 23, 'docList': '[{"path":"/","name":"test-a.zip","type":1}]', 'targetPath': '/', 'targetName': 'y.zip'}).encode())
d = json.loads(op2.open(req, timeout=30).read().decode('utf-8'))
check('T6 压缩权限拒绝', d.get('status') == 'fail', str(d)[:150])

# ===== T7 压缩（多选 文件+目录）=====
docList = json.dumps([{'path': '/', 'name': 'pkgA', 'type': 2}, {'path': '/', 'name': 'readme.txt', 'type': 1}])
d = post('/Doc/compressDocPrepare.do', {'reposId': 23, 'docList': docList, 'targetPath': '/', 'targetName': 'combo.zip'})
check('T7 prepare msgData=5', d.get('msgData') == 5, str(d)[:200])
r = poll(d['data']['id'])
check('T7 压缩完成', r.get('status') == 'ok', str(r)[:200])
check('T7 zip存在', os.path.exists(RDATA + '/combo.zip'), str(tree()))

# zip 内容验证：pkgA/ 子树 + readme.txt
import zipfile
z = zipfile.ZipFile(RDATA + '/combo.zip')
names = sorted(z.namelist())
need = ['pkgA/顶层目录/中文文档.md', 'readme.txt']
check('T7 zip内容完整', all(any(n == x or n == x + '/' or n.startswith(x + '/') for n in names) for x in need), str(names))
z.close()

# ===== T8 压缩冲突 =====
d = post('/Doc/compressDocPrepare.do', {'reposId': 23, 'docList': docList, 'targetPath': '/', 'targetName': 'combo.zip'})
check('T8 冲突conflict', d.get('msgData') == 'conflict' and d['data']['names'] == ['combo.zip'], str(d)[:200])
d = post('/Doc/compressDocPrepare.do', {'reposId': 23, 'docList': docList, 'targetPath': '/', 'targetName': 'combo.zip', 'overwriteFlag': 1})
r = poll(d['data']['id'])
check('T8 覆盖压缩完成', r.get('status') == 'ok', str(r)[:200])

# ===== T9 空/坏zip报错 =====
def upload_ascii(name, filepath):
    SZ = os.path.getsize(filepath)
    boundary = uuid.uuid4().hex
    parts = [('reposId', '23'), ('path', '/'), ('type', '1'), ('name', name), ('size', str(SZ))]
    body = b''
    for k, v in parts:
        body += ('--%s\r\nContent-Disposition: form-data; name="%s"\r\n\r\n%s\r\n' % (boundary, k, v)).encode()
    content = open(filepath, 'rb').read()
    body += ('--%s\r\nContent-Disposition: form-data; name="uploadFile"; filename="%s"\r\nContent-Type: application/zip\r\n\r\n' % (boundary, name)).encode()
    body += content + b'\r\n'
    body += ('--%s--\r\n' % boundary).encode()
    req = urllib.request.Request(BASE + '/Doc/uploadDoc.do', data=body, headers={'Content-Type': 'multipart/form-data; boundary=' + boundary})
    opener.open(req, timeout=30)

import uuid
open(r'D:/Dev/DocSys/logs/bad.zip', 'wb').write(b'not a zip file')
upload_ascii('bad.zip', r'D:/Dev/DocSys/logs/bad.zip')
d = post('/Doc/extractDocPrepare.do', {'reposId': 23, 'path': '/', 'name': 'bad.zip', 'targetPath': '/', 'targetName': 'bad-out', 'overwriteFlag': 1})
check('T9 坏zip任务可创建', d.get('msgData') == 5, str(d)[:200])
r = poll(d['data']['id'])
check('T9 坏zip任务失败态', r.get('status') == 'fail' and '解压失败' in (r.get('msgInfo') or ''), str(r)[:200])

# ===== T10 非压缩文件拒绝 =====
d = post('/Doc/extractDocPrepare.do', {'reposId': 23, 'path': '/', 'name': 'readme.txt', 'targetPath': '/', 'targetName': 'x'})
check('T10 非压缩文件拒绝', d.get('status') == 'fail' and '不是压缩文件' in (d.get('msgInfo') or ''), str(d)[:200])

# ===== T11 Zip Slip 防护（构造恶意zip）=====
mz = zipfile.ZipFile(r'D:/Dev/DocSys/logs/evil.zip', 'w')
mz.writestr('../evil.txt', 'pwned')
mz.writestr('ok.txt', 'safe content')
mz.close()
upload_ascii('evil.zip', r'D:/Dev/DocSys/logs/evil.zip')
d = post('/Doc/extractDocPrepare.do', {'reposId': 23, 'path': '/', 'name': 'evil.zip', 'targetPath': '/', 'targetName': 'evil-out', 'overwriteFlag': 1})
r = poll(d['data']['id'])
check('T11 恶意zip任务结果', r.get('status') in ('ok', 'fail'), str(r)[:200])
check('T11 逃逸文件未落地', not os.path.exists(RDATA + '/../evil.txt') and not os.path.exists(r'C:/DocSysReposes/23/data/evil.txt'))
check('T11 正常条目落地', os.path.exists(RDATA + '/evil-out/ok.txt'), str(tree('evil-out')))

# ===== T12 分享参数拒绝 =====
d = post('/Doc/extractDocPrepare.do', {'reposId': 23, 'path': '/', 'name': 'test-a.zip', 'targetPath': '/', 'targetName': 'x', 'shareId': 5})
check('T12 分享页拒绝', d.get('status') == 'fail' and '分享' in (d.get('msgInfo') or ''), str(d)[:150])

# ===== T13 非法entryList拒绝 =====
d = post('/Doc/extractDocPrepare.do', {'reposId': 23, 'path': '/', 'name': 'test-a.zip', 'targetPath': '/', 'targetName': 'x', 'entryList': '["../../etc/passwd"]'})
check('T13 非法entry拒绝', d.get('status') == 'fail', str(d)[:150])

# ===== T14 非法targetName拒绝 =====
d = post('/Doc/extractDocPrepare.do', {'reposId': 23, 'path': '/', 'name': 'test-a.zip', 'targetPath': '/', 'targetName': 'a/b'})
check('T14 非法targetName拒绝', d.get('status') == 'fail', str(d)[:150])

print()
print('===== 汇总: PASS %d / FAIL %d =====' % (len(PASS), len(FAIL)))
for n, dt in FAIL:
    print('FAIL:', n, '|', dt[:300])
