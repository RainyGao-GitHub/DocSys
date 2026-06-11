# ============================================================================
# run_compare.ps1 - Compile, run both conversions, and compare bin files
# ============================================================================
$ErrorActionPreference = "Continue"

$srcRoot   = "d:\Dev\DocSys\src"
$classRoot = "d:\Dev\DocSys\WebRoot\WEB-INF\classes"
$libDir    = "d:\Dev\DocSys\WebRoot\WEB-INF\lib"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  1. 编译 FileConverter.java" -ForegroundColor Cyan
Write-Host "============================================================"

# Build classpath from all jars
$cp = $classRoot
Get-ChildItem -Path $libDir -Filter "*.jar" | ForEach-Object {
    $cp += ";$($_.FullName)"
}

$sourceFile = "$srcRoot\com\DocSystem\websocket\office\FileConverter\FileConverter.java"
$classFile  = "$classRoot\com\DocSystem\websocket\office\FileConverter\FileConverter.class"

Write-Host "Compiling $sourceFile ..."
$compileResult = javac -encoding UTF-8 -cp $cp -d $classRoot $sourceFile 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Compilation failed:" -ForegroundColor Red
    Write-Host $compileResult
    exit 1
}
Write-Host "Compilation successful." -ForegroundColor Green

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  2. 运行 FileConverter (Native + OnlyOffice 双向转换)" -ForegroundColor Cyan
Write-Host "============================================================"

$logFile = "C:\Users\65205\Desktop\FileConvert.log"

# Check input file exists
$inputFile = "C:\Users\65205\Desktop\Office测试文件\FB2103工时统计 (1).xlsx"
if (-not (Test-Path $inputFile)) {
    Write-Host "[WARNING] 输入文件不存在: $inputFile" -ForegroundColor Yellow
    Write-Host "请确保文件存在后重试。" -ForegroundColor Yellow
    exit 1
}

Write-Host "Running FileConverter.main()..."
Write-Host "日志输出: $logFile"

# Run the Java class
$runResult = java -cp $cp com.DocSystem.websocket.office.FileConverter.FileConverter 2>&1
$exitCode = $LASTEXITCODE

Write-Host "Java exit code: $exitCode"

# Show log summary
if (Test-Path $logFile) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "  3. 转换日志摘要" -ForegroundColor Cyan
    Write-Host "============================================================"
    $logContent = Get-Content $logFile -Encoding UTF8
    $logContent | Select-String -Pattern "ERROR|====|结果|差异|存在|大小|相同|不同|Native|OnlyOffice|测试完成|x2t|首个差异" | ForEach-Object {
        $line = $_.Line
        if ($line -match "ERROR|异常|失败") {
            Write-Host $line -ForegroundColor Red
        } elseif ($line -match "成功|相同|SUCCEEDED") {
            Write-Host $line -ForegroundColor Green
        } elseif ($line -match "====") {
            Write-Host $line -ForegroundColor Yellow
        } else {
            Write-Host $line
        }
    }
}

# ============================================================================
# 4. Run detailed comparison
# ============================================================================
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  4. 详细对比分析" -ForegroundColor Cyan
Write-Host "============================================================"

$nativeBin = "C:\Users\65205\Desktop\BinCompare\native\Editor.bin"
$ooBin     = "C:\Users\65205\Desktop\BinCompare\onlyoffice\Editor.bin"

if (-not (Test-Path $nativeBin)) {
    Write-Host "[ERROR] Native bin not found: $nativeBin" -ForegroundColor Red
}
if (-not (Test-Path $ooBin)) {
    Write-Host "[ERROR] OnlyOffice bin not found: $ooBin" -ForegroundColor Red
}

if ((Test-Path $nativeBin) -and (Test-Path $ooBin)) {
    Write-Host ""
    
    $nativeBytes = [System.IO.File]::ReadAllBytes($nativeBin)
    $ooBytes     = [System.IO.File]::ReadAllBytes($ooBin)
    
    Write-Host "Native     size: $($nativeBytes.Length) bytes ($([math]::Round($nativeBytes.Length/1024,2)) KB)" -ForegroundColor White
    Write-Host "OnlyOffice size: $($ooBytes.Length) bytes ($([math]::Round($ooBytes.Length/1024,2)) KB)" -ForegroundColor White
    
    if ($nativeBytes.Length -eq $ooBytes.Length) {
        $identical = $true
        $firstDiff = -1
        $diffs = 0
        for ($i = 0; $i -lt $nativeBytes.Length; $i++) {
            if ($nativeBytes[$i] -ne $ooBytes[$i]) {
                $diffs++
                if ($firstDiff -eq -1) { $firstDiff = $i }
                $identical = $false
            }
        }
        
        if ($identical) {
            Write-Host ">>> 两个文件完全相同！ <<<" -ForegroundColor Green
        } else {
            Write-Host "文件大小相同但内容不同: $diffs 字节差异 (首个差异 @ 0x$($firstDiff.ToString('X')) )" -ForegroundColor Yellow
            
            # Show first 30 differences
            Write-Host "`n前30个差异:" -ForegroundColor Yellow
            $shown = 0
            for ($i = 0; $i -lt $nativeBytes.Length -and $shown -lt 30; $i++) {
                if ($nativeBytes[$i] -ne $ooBytes[$i]) {
                    Write-Host ("  0x{0:X8}  Native=0x{1:X2}  OO=0x{2:X2}" -f $i, $nativeBytes[$i], $ooBytes[$i])
                    $shown++
                }
            }
        }
    } else {
        $sizeDiff = $nativeBytes.Length - $ooBytes.Length
        Write-Host "文件大小不同！差异: $sizeDiff bytes ($([math]::Round($sizeDiff/1024,2)) KB)" -ForegroundColor Magenta
        if ($sizeDiff -gt 0) {
            Write-Host "  Native 更大 (+$sizeDiff bytes)" -ForegroundColor Magenta
        } else {
            Write-Host "  OnlyOffice 更大 (+$(-$sizeDiff) bytes)" -ForegroundColor Magenta
        }
        
        $minLen = [Math]::Min($nativeBytes.Length, $ooBytes.Length)
        $diffs = 0
        $firstDiff = -1
        for ($i = 0; $i -lt $minLen; $i++) {
            if ($nativeBytes[$i] -ne $ooBytes[$i]) {
                $diffs++
                if ($firstDiff -eq -1) { $firstDiff = $i }
            }
        }
        Write-Host "  重叠区域中不同字节: $diffs (首个差异 @ 0x$($firstDiff.ToString('X')) )" -ForegroundColor Yellow
        
        Write-Host "`n前30个差异:" -ForegroundColor Yellow
        $shown = 0
        for ($i = 0; $i -lt $minLen -and $shown -lt 30; $i++) {
            if ($nativeBytes[$i] -ne $ooBytes[$i]) {
                Write-Host ("  0x{0:X8}  Native=0x{1:X2}  OO=0x{2:X2}" -f $i, $nativeBytes[$i], $ooBytes[$i])
                $shown++
            }
        }
    }
    
    # ================================================================
    # 5. Keyword analysis for the error
    # ================================================================
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "  5. 与前端报错相关分析" -ForegroundColor Cyan
    Write-Host "============================================================"
    Write-Host "前端报错: Cannot read properties of null (reading 'VX')"
    Write-Host "调用链: onChangeProtectSheet -> getWSProps -> qmi"
    Write-Host ""
    
    # Search for "VX" in ASCII context
    function Search-Keyword {
        param([byte[]]$Bytes, [string]$Keyword, [string]$Label)
        $kwBytes = [System.Text.Encoding]::ASCII.GetBytes($Keyword)
        $positions = @()
        for ($i = 0; $i -le $Bytes.Length - $kwBytes.Length; $i++) {
            $match = $true
            for ($j = 0; $j -lt $kwBytes.Length; $j++) {
                if ($Bytes[$i + $j] -ne $kwBytes[$j]) { $match = $false; break }
            }
            if ($match) { $positions += $i }
        }
        return $positions
    }
    
    $keywords = @("VX", "protect", "Protect", "PROTECT", "lock", "Lock", 
                  "null", "NULL", "undefined", "sheet", "Worksheet", 
                  "WSProp", "getWSProps")
    
    foreach ($kw in $keywords) {
        $nPos = Search-Keyword -Bytes $nativeBytes -Keyword $kw -Label "Native"
        $oPos = Search-Keyword -Bytes $ooBytes -Keyword $kw -Label "OO"
        
        if ($nPos.Count -gt 0 -or $oPos.Count -gt 0) {
            $color = if ($nPos.Count -ne $oPos.Count) { "Yellow" } else { "White" }
            Write-Host ("[{0,-12}] Native: {1,4}次  OO: {2,4}次" -f $kw, $nPos.Count, $oPos.Count) -ForegroundColor $color
            
            if ($nPos.Count -ne $oPos.Count) {
                $nPosStr = ($nPos | ForEach-Object { "0x{0:X}" -f $_ }) -join ", "
                $oPosStr = ($oPos | ForEach-Object { "0x{0:X}" -f $_ }) -join ", "
                if ($nPosStr.Length -gt 120) { $nPosStr = $nPosStr.Substring(0, 120) + "..." }
                if ($oPosStr.Length -gt 120) { $oPosStr = $oPosStr.Substring(0, 120) + "..." }
                Write-Host ("         Native  : {0}" -f $nPosStr) -ForegroundColor DarkYellow
                Write-Host ("         OO      : {0}" -f $oPosStr) -ForegroundColor DarkYellow
            }
        }
    }
    
    # ================================================================
    # 6. Show hex context around "VX" occurrences
    # ================================================================
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "  6. 'VX' 关键字上下文分析 (各显示前3处)" -ForegroundColor Cyan
    Write-Host "============================================================"
    
    function Show-KeywordContext {
        param([byte[]]$Bytes, [string]$Keyword, [string]$Label, [int]$MaxShow = 3)
        $kwBytes = [System.Text.Encoding]::ASCII.GetBytes($Keyword)
        $shown = 0
        for ($i = 0; $i -le $Bytes.Length - $kwBytes.Length -and $shown -lt $MaxShow; $i++) {
            $match = $true
            for ($j = 0; $j -lt $kwBytes.Length; $j++) {
                if ($Bytes[$i + $j] -ne $kwBytes[$j]) { $match = $false; break }
            }
            if ($match) {
                $ctxStart = [Math]::Max(0, $i - 40)
                $ctxEnd = [Math]::Min($Bytes.Length - 1, $i + 60)
                $hexStr = ""
                $txtStr = ""
                for ($p = $ctxStart; $p -le $ctxEnd; $p++) {
                    $b = $Bytes[$p]
                    $hexStr += if ($p -ge $i -and $p -lt $i + $kwBytes.Length) { 
                        "[{0:X2}]" -f $b 
                    } else { 
                        " {0:X2} " -f $b 
                    }
                    $txtStr += if ($b -ge 32 -and $b -le 126) { [char]$b } else { '.' }
                }
                Write-Host ("  {0} @ 0x{1:X8}:" -f $Label, $i) -ForegroundColor White
                Write-Host ("    {0}" -f $hexStr) -ForegroundColor Gray
                Write-Host ("    {0}" -f $txtStr) -ForegroundColor DarkGray
                Write-Host ""
                $shown++
            }
        }
    }
    
    Show-KeywordContext -Bytes $nativeBytes -Keyword "VX" -Label "Native"
    Show-KeywordContext -Bytes $ooBytes -Keyword "VX" -Label "OnlyOffice"
    
    # Also search for protect-related patterns
    Write-Host "--- 'protect' 上下文 (Native) ---" -ForegroundColor White
    Show-KeywordContext -Bytes $nativeBytes -Keyword "protect" -Label "Native" -MaxShow 3
    Write-Host "--- 'protect' 上下文 (OnlyOffice) ---" -ForegroundColor White
    Show-KeywordContext -Bytes $ooBytes -Keyword "protect" -Label "OnlyOffice" -MaxShow 3
    
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  完成！" -ForegroundColor Cyan
Write-Host "============================================================"
Write-Host "完整日志: $logFile"
Write-Host "输出目录: C:\Users\65205\Desktop\BinCompare\"
