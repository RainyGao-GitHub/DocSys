# ============================================================================
# BinCompare.ps1 - 对比 Native vs OnlyOffice 转换的 Editor.bin 文件
# ============================================================================
param(
    [string]$NativeBin = "C:\Users\65205\Desktop\BinCompare\native\Editor.bin",
    [string]$OOBin     = "C:\Users\65205\Desktop\BinCompare\onlyoffice\Editor.bin",
    [string]$ReportDir = "C:\Users\65205\Desktop\BinCompare\report"
)

$ErrorActionPreference = "Stop"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Editor.bin 对比分析工具" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $NativeBin)) {
    Write-Host "[ERROR] Native bin 不存在: $NativeBin" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $OOBin)) {
    Write-Host "[ERROR] OnlyOffice bin 不存在: $OOBin" -ForegroundColor Red
    exit 1
}

# 创建报告目录
if (-not (Test-Path $ReportDir)) {
    New-Item -ItemType Directory -Path $ReportDir -Force | Out-Null
}

$nativeBytes = [System.IO.File]::ReadAllBytes($NativeBin)
$ooBytes     = [System.IO.File]::ReadAllBytes($OOBin)

$nativeLen = $nativeBytes.Length
$ooLen     = $ooBytes.Length

Write-Host "============================================================" -ForegroundColor Yellow
Write-Host "  基本文件信息" -ForegroundColor Yellow
Write-Host "============================================================"
Write-Host "Native     : $NativeBin"
Write-Host "  Size     : $nativeLen bytes ($([math]::Round($nativeLen/1024, 2)) KB)"
Write-Host "OnlyOffice : $OOBin"
Write-Host "  Size     : $ooLen bytes ($([math]::Round($ooLen/1024, 2)) KB)"
Write-Host ""

if ($nativeLen -eq $ooLen) {
    $identical = $true
    for ($i = 0; $i -lt $nativeLen; $i++) {
        if ($nativeBytes[$i] -ne $ooBytes[$i]) {
            $identical = $false
            break
        }
    }
    if ($identical) {
        Write-Host ">>> 两个文件完全相同！ <<<" -ForegroundColor Green
        exit 0
    }
}

$sizeDiff = $nativeLen - $ooLen
Write-Host "大小差异: $sizeDiff bytes" -ForegroundColor $(if ($sizeDiff -eq 0) { "White" } else { "Magenta" })

# ============================================================================
# 1. 逐字节差异分析
# ============================================================================
Write-Host ""
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host "  1. 逐字节差异分析" -ForegroundColor Yellow
Write-Host "============================================================"

$minLen = [Math]::Min($nativeLen, $ooLen)
$diffCount = 0
$firstDiffPos = -1
$diffRegions = @()  # 记录差异区间
$regionStart = -1

$diffDetailFile = Join-Path $ReportDir "diff_detail.txt"
$diffWriter = [System.IO.StreamWriter]::new($diffDetailFile, $false, [System.Text.Encoding]::UTF8)

for ($i = 0; $i -lt $minLen; $i++) {
    if ($nativeBytes[$i] -ne $ooBytes[$i]) {
        $diffCount++
        if ($firstDiffPos -eq -1) { $firstDiffPos = $i }
        if ($regionStart -eq -1) { $regionStart = $i }
        
        # 记录差异详情（显示前后各8字节上下文）
        if ($diffCount -le 200) {
            $ctxStart = [Math]::Max(0, $i - 8)
            $ctxEnd = [Math]::Min($minLen - 1, $i + 8)
            $ctxNative = ""
            $ctxOO = ""
            for ($j = $ctxStart; $j -le $ctxEnd; $j++) {
                $marker = if ($j -eq $i) { ">>" } else { "  " }
                $ctxNative += "$marker$($nativeBytes[$j].ToString('X2')) "
                $ctxOO += "$marker$($ooBytes[$j].ToString('X2')) "
            }
            $diffWriter.WriteLine("Offset=0x{0:X8} ({0}) Native=0x{1:X2} OO=0x{2:X2}" -f $i, $nativeBytes[$i], $ooBytes[$i])
            $diffWriter.WriteLine("  Native: $ctxNative")
            $diffWriter.WriteLine("  OO    : $ctxOO")
            $diffWriter.WriteLine("")
        }
    } else {
        if ($regionStart -ne -1) {
            $diffRegions += @{ Start = $regionStart; End = $i - 1; Len = $i - $regionStart }
            $regionStart = -1
        }
    }
}
if ($regionStart -ne -1) {
    $diffRegions += @{ Start = $regionStart; End = $minLen - 1; Len = $minLen - $regionStart }
}
$diffWriter.Close()

Write-Host "相同字节: $($minLen - $diffCount)" -ForegroundColor Green
Write-Host "不同字节: $diffCount" -ForegroundColor Red
Write-Host "差异比例: $([math]::Round($diffCount / $minLen * 100, 4))%" -ForegroundColor $(if ($diffCount -gt 0) { "Red" } else { "Green" })
Write-Host "首个差异: offset=0x$($firstDiffPos.ToString('X')) ($firstDiffPos)"

if ($diffRegions.Count -gt 0) {
    Write-Host "差异区间数: $($diffRegions.Count)"
    Write-Host ""
    Write-Host "差异区间列表:" -ForegroundColor White
    Write-Host ("{0,10} {1,10} {2,10} {3,10}" -f "Start", "End", "Length", "Start(Hex)")
    Write-Host ("{0,10} {1,10} {2,10} {3,10}" -f "-----", "---", "------", "----------")
    $diffRegions | Sort-Object Start | Select-Object -First 30 | ForEach-Object {
        Write-Host ("{0,10} {1,10} {2,10} 0x{3:X8}" -f $_.Start, $_.End, $_.Len, $_.Start)
    }
    if ($diffRegions.Count -gt 30) {
        Write-Host ("  ... 共 {0} 个差异区间，详细信息见 {1}" -f $diffRegions.Count, $diffDetailFile)
    }
}

if ($nativeLen -ne $ooLen) {
    Write-Host ""
    Write-Host "文件长度不同！额外字节:" -ForegroundColor Magenta
    if ($nativeLen -gt $ooLen) {
        Write-Host "  Native 多出 $($nativeLen - $ooLen) bytes (offset $ooLen ~ $($nativeLen-1))"
    } else {
        Write-Host "  OnlyOffice 多出 $($ooLen - $nativeLen) bytes (offset $nativeLen ~ $($ooLen-1))"
    }
}

# ============================================================================
# 2. 文件头部对比 (前256字节)
# ============================================================================
Write-Host ""
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host "  2. 文件头部对比 (前256字节)" -ForegroundColor Yellow
Write-Host "============================================================"

function Format-HexDump {
    param([byte[]]$Bytes, [int]$Start, [int]$Count, [string]$Label)
    $end = [Math]::Min($Start + $Count, $Bytes.Length)
    Write-Host "$Label" -ForegroundColor White
    for ($offset = $Start; $offset -lt $end; $offset += 16) {
        $hexStr = ""
        $txtStr = ""
        for ($j = 0; $j -lt 16; $j++) {
            $pos = $offset + $j
            if ($pos -lt $end) {
                $b = $Bytes[$pos]
                $hexStr += "{0:X2} " -f $b
                $txtStr += if ($b -ge 32 -and $b -le 126) { [char]$b } else { '.' }
            } else {
                $hexStr += "   "
                $txtStr += " "
            }
        }
        Write-Host ("  {0:X8}: {1} |{2}|" -f $offset, $hexStr, $txtStr)
    }
}

Format-HexDump -Bytes $nativeBytes -Start 0 -Count 256 -Label "Native:"
Write-Host ""
Format-HexDump -Bytes $ooBytes -Start 0 -Count 256 -Label "OnlyOffice:"

# ============================================================================
# 3. JSON/结构化内容提取 (搜索 bin 中的可读文本段)
# ============================================================================
Write-Host ""
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host "  3. 可读文本段提取" -ForegroundColor Yellow
Write-Host "============================================================"

function Extract-ReadableSegments {
    param([byte[]]$Bytes, [string]$Label, [int]$MinLen = 20)
    $textFile = Join-Path $ReportDir "$Label`_readable.txt"
    $textWriter = [System.IO.StreamWriter]::new($textFile, $false, [System.Text.Encoding]::UTF8)
    
    $segStart = -1
    $segments = @()
    
    for ($i = 0; $i -lt $Bytes.Length; $i++) {
        $b = $Bytes[$i]
        $isReadable = ($b -ge 32 -and $b -le 126) -or $b -eq 9 -or $b -eq 10 -or $b -eq 13
        if ($isReadable) {
            if ($segStart -eq -1) { $segStart = $i }
        } else {
            if ($segStart -ne -1) {
                $segLen = $i - $segStart
                if ($segLen -ge $MinLen) {
                    $segBytes = $Bytes[$segStart..($i-1)]
                    $segStr = [System.Text.Encoding]::ASCII.GetString($segBytes)
                    $segments += @{ Offset = $segStart; Len = $segLen; Text = $segStr }
                    $textWriter.WriteLine("--- offset=0x{0:X8} len={1} ---" -f $segStart, $segLen)
                    $textWriter.WriteLine($segStr)
                    $textWriter.WriteLine("")
                }
                $segStart = -1
            }
        }
    }
    $textWriter.Close()
    
    Write-Host "$Label : $($segments.Count) 个可读文本段 (>=${MinLen}字符)" -ForegroundColor White
    $segments | Select-Object -First 20 | ForEach-Object {
        $preview = $_.Text.Substring(0, [Math]::Min(80, $_.Text.Length)) -replace "`r`n", "\\n" -replace "`n", "\\n"
        Write-Host ("  0x{0:X8} [{1,5}] {2}" -f $_.Offset, $_.Len, $preview)
    }
    if ($segments.Count -gt 20) {
        Write-Host "  ... 完整列表见 $textFile"
    }
    return $segments
}

$nativeSegs = Extract-ReadableSegments -Bytes $nativeBytes -Label "Native" -MinLen 20
Write-Host ""
$ooSegs = Extract-ReadableSegments -Bytes $ooBytes -Label "OnlyOffice" -MinLen 20

# ============================================================================
# 4. 对比可读文本段的关键差异
# ============================================================================
Write-Host ""
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host "  4. 关键文本段差异（Native 有而 OnlyOffice 没有的）" -ForegroundColor Yellow
Write-Host "============================================================"

# 构建 OO 文本索引
$ooTextSet = @{}
foreach ($seg in $ooSegs) {
    $key = $seg.Text.Substring(0, [Math]::Min(40, $seg.Text.Length))
    if (-not $ooTextSet.ContainsKey($key)) { $ooTextSet[$key] = @() }
    $ooTextSet[$key] += $seg
}

$nativeOnly = @()
foreach ($seg in $nativeSegs) {
    $key = $seg.Text.Substring(0, [Math]::Min(40, $seg.Text.Length))
    if (-not $ooTextSet.ContainsKey($key)) {
        $nativeOnly += $seg
    }
}
Write-Host "Native 独有文本段: $($nativeOnly.Count)"

# 反过来
$nativeTextSet = @{}
foreach ($seg in $nativeSegs) {
    $key = $seg.Text.Substring(0, [Math]::Min(40, $seg.Text.Length))
    if (-not $nativeTextSet.ContainsKey($key)) { $nativeTextSet[$key] = @() }
    $nativeTextSet[$key] += $seg
}
$ooOnly = @()
foreach ($seg in $ooSegs) {
    $key = $seg.Text.Substring(0, [Math]::Min(40, $seg.Text.Length))
    if (-not $nativeTextSet.ContainsKey($key)) {
        $ooOnly += $seg
    }
}
Write-Host "OnlyOffice 独有文本段: $($ooOnly.Count)"

if ($nativeOnly.Count -gt 0) {
    Write-Host "`nNative 独有文本段示例:" -ForegroundColor Yellow
    $nativeOnly | Select-Object -First 10 | ForEach-Object {
        $preview = $_.Text.Substring(0, [Math]::Min(120, $_.Text.Length)) -replace "`r`n", "\\n"
        Write-Host ("  0x{0:X8} [{1,5}] {2}" -f $_.Offset, $_.Len, $preview)
    }
}

if ($ooOnly.Count -gt 0) {
    Write-Host "`nOnlyOffice 独有文本段示例:" -ForegroundColor Yellow
    $ooOnly | Select-Object -First 10 | ForEach-Object {
        $preview = $_.Text.Substring(0, [Math]::Min(120, $_.Text.Length)) -replace "`r`n", "\\n"
        Write-Host ("  0x{0:X8} [{1,5}] {2}" -f $_.Offset, $_.Len, $preview)
    }
}

# ============================================================================
# 5. 查找特定关键字 (VX, protect, sheet 等错误相关)
# ============================================================================
Write-Host ""
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host "  5. 与前端报错相关的关键字搜索" -ForegroundColor Yellow
Write-Host "============================================================"

$keywords = @("VX", "protect", "Protect", "PROTECT", "sheet", "Sheet", "SHEET", 
              "lock", "Lock", "LOCK", "null", "NULL", "undefined", "worksheet",
              "getWSProps", "onChangeProtectSheet", "WSProp")

foreach ($kw in $keywords) {
    $kwBytes = [System.Text.Encoding]::ASCII.GetBytes($kw)
    
    $nativePositions = @()
    for ($i = 0; $i -le $nativeBytes.Length - $kwBytes.Length; $i++) {
        $match = $true
        for ($j = 0; $j -lt $kwBytes.Length; $j++) {
            if ($nativeBytes[$i + $j] -ne $kwBytes[$j]) { $match = $false; break }
        }
        if ($match) { $nativePositions += $i }
    }
    
    $ooPositions = @()
    for ($i = 0; $i -le $ooBytes.Length - $kwBytes.Length; $i++) {
        $match = $true
        for ($j = 0; $j -lt $kwBytes.Length; $j++) {
            if ($ooBytes[$i + $j] -ne $kwBytes[$j]) { $match = $false; break }
        }
        if ($match) { $ooPositions += $i }
    }
    
    if ($nativePositions.Count -gt 0 -or $ooPositions.Count -gt 0) {
        $color = if ($nativePositions.Count -ne $ooPositions.Count) { "Yellow" } else { "White" }
        Write-Host ("[{0}] Native: {1}次  OO: {2}次" -f $kw, $nativePositions.Count, $ooPositions.Count) -ForegroundColor $color
        
        if ($nativePositions.Count -ne $ooPositions.Count) {
            Write-Host ("  Native  位置: {0}" -f ($nativePositions | ForEach-Object { "0x{0:X}" -f $_ }) -join ", ")
            Write-Host ("  OO      位置: {0}" -f ($ooPositions | ForEach-Object { "0x{0:X}" -f $_ }) -join ", ")
        }
    }
}

# ============================================================================
# 6. 生成汇总报告
# ============================================================================
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  分析完成" -ForegroundColor Cyan
Write-Host "============================================================"
Write-Host "详细差异记录: $diffDetailFile" -ForegroundColor White
Write-Host "可读文本段:   $(Join-Path $ReportDir 'Native_readable.txt')" -ForegroundColor White
Write-Host "可读文本段:   $(Join-Path $ReportDir 'OnlyOffice_readable.txt')" -ForegroundColor White
Write-Host ""
Write-Host "差异总数: $diffCount" -ForegroundColor $(if ($diffCount -eq 0) { "Green" } else { "Red" })
