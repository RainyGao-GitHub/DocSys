$root = "D:/Dev/DocSys/src/com/DocSystem/websocket/office"
$count = 0
Get-ChildItem $root -Filter "*.java" -Recurse | ForEach-Object {
    $c = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
    if ($c -match '_copy\(\w+ oSrc\)' -and $c -match 'this\.m_\w+\.(m_pPointer\.)?copy\(oSrc\.') {
        Write-Host $_.FullName
        $count++
    }
}
Write-Host "--- Total: $count files ---"
