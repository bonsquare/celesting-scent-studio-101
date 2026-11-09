Add-Type -AssemblyName System.Drawing
foreach ($size in @(192,512)) {
  $bmp = New-Object System.Drawing.Bitmap($size,$size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $scale = $size / 192
  $g.ScaleTransform($scale,$scale)
  $background = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#3457d5'))
  $cream = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#f0f5ff'))
  $pink = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#fa6b5b'))
  $cap = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#f4d9ca'))
  $g.FillRectangle($background,0,0,192,192)
  $g.FillRectangle($cap,77,29,38,24)
  $g.FillRectangle($cap,65,51,62,13)
  $g.FillRectangle($cream,47,65,98,98)
  $points = [System.Drawing.Point[]]@((New-Object System.Drawing.Point(96,82)),(New-Object System.Drawing.Point(120,112)),(New-Object System.Drawing.Point(121,135)),(New-Object System.Drawing.Point(109,150)),(New-Object System.Drawing.Point(83,150)),(New-Object System.Drawing.Point(71,135)),(New-Object System.Drawing.Point(72,112)))
  $g.FillPolygon($pink,$points)
  $g.FillEllipse($cream,86,116,20,20)
  $g.Dispose()
  $bmp.Save((Join-Path $PSScriptRoot "..\public\icon-$size.png"),[System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}
