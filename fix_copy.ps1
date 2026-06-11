# Batch fix all _copy() methods - add null-safety guards
# Strategy: 
#   1. For "this.m_oXxx.m_pPointer.copy(oSrc.m_oXxx.m_pPointer)" 
#      → wrap in null check, add this-field init
#   2. For "this.m_oXxx.copy(oSrc.m_oXxx)" (non-nullable)
#      → wrap in null check, add this-field init  

$root = "D:/Dev/DocSys/src/com/DocSystem/websocket/office"
$fixed = 0
$files = 0

Get-ChildItem $root -Filter "*.java" -Recurse | ForEach-Object {
    $filepath = $_.FullName
    $content = [System.IO.File]::ReadAllText($filepath, [System.Text.Encoding]::UTF8)
    $original = $content
    $changed = $false

    # Pattern 1: this.m_oXxx.copy(oSrc.m_oXxx)  -- non-nullable field copy
    # Example: this.m_oVal.copy(oSrc.m_oVal)
    # Find the init method to determine field type, or use generic approach
    # We'll add: if (oSrc.FIELD != null) { if (this.FIELD == null) { this.FIELD = new TYPE(); } this.FIELD.copy(oSrc.FIELD); }
    
    # Pattern 2: this.m_oXxx.m_pPointer.copy(oSrc.m_oXxx.m_pPointer) -- nullable field inner copy
    # We'll add: if (this.m_oXxx == null) { this.m_oXxx = new nullable<>(); } if (oSrc.m_oXxx.m_pPointer != null) { this.m_oXxx.m_pPointer.copy(oSrc.m_oXxx.m_pPointer); }
    
    # Process nullable pattern: this.NAME.m_pPointer.copy(oSrc.NAME.m_pPointer)
    $regex1 = '(\s+)(this\.(m_o\w+)\.m_pPointer\.copy\(oSrc\.\3\.m_pPointer\);)'
    if ($content -match $regex1) {
        $content = $content -replace $regex1, '$1if (this.$3 == null) { this.$3 = new nullable<>(); }$1if (oSrc.$3.m_pPointer != null) { $2 }'
        $changed = $true
    }
    
    # Process non-nullable pattern: this.NAME.copy(oSrc.NAME)  
    # But exclude patterns inside the guard we just added
    $regex2 = '(\s+)(?<!if \()(this\.(m_o\w+)\.copy\(oSrc\.\3\);)'
    if ($content -match $regex2) {
        $content = $content -replace $regex2, '$1if (oSrc.$3 != null) { $2 }'
        $changed = $true
    }
    
    if ($changed) {
        [System.IO.File]::WriteAllText($filepath, $content, (New-Object System.Text.UTF8Encoding $false))
        $files++
        $fixed++
        Write-Host "Fixed: $filepath"
    }
}

Write-Host "=== Done: $fixed fixes in $files files ==="
