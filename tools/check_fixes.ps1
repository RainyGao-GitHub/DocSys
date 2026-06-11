$files = @(
    "OOXML/ComplexTypes/Word/COnOff2.java",
    "OOXML/ComplexTypes/Word/CJc.java",
    "OOXML/ComplexTypes/Word/CDecimalNumberWord.java",
    "OOXML/ComplexTypes/Word/CFonts.java",
    "OOXML/ComplexTypes/CDecimalNumber.java",
    "OOXML/OOX/Logic/CNumPr.java",
    "OOXML/PPTX/Logic/UniFill.java"
)
$root = "D:/Dev/DocSys/src/com/DocSystem/websocket/office"
foreach ($f in $files) {
    $path = "$root/$f"
    $c = Get-Content $path -Raw -ErrorAction SilentlyContinue
    if ($c -match 'if \(this\.m_o\w+ == null\)' -or $c -match 'try.*_init\(\)') {
        Write-Host "HAS fix: $f"
    } else {
        Write-Host "NEEDS fix: $f"
    }
}
