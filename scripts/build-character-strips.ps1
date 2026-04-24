# Concatenates 0x72 DungeonTilesetII per-creature frames into horizontal 8-frame
# spritesheet strips (idle_f0..3 + run_f0..3). For creatures that only ship an
# `_anim_` set, the same 4 frames are duplicated as both idle and run.
#
# Input:  /tmp/deathmarch-assets/0x72/0x72_DungeonTilesetII_v1.7/frames/
# Output: public/assets/sprites-pixel/characters/<creature>.png
#
# Run from repo root: pwsh scripts/build-character-strips.ps1

Add-Type -AssemblyName System.Drawing

$srcDir = Join-Path $env:TEMP "deathmarch-assets/0x72/0x72_DungeonTilesetII_v1.7/frames"
if (-not (Test-Path $srcDir)) {
    Write-Error "Source frames dir not found: $srcDir"
    exit 1
}

$dstDir = Join-Path $PSScriptRoot "../public/assets/sprites-pixel/characters"
$dstDir = [System.IO.Path]::GetFullPath($dstDir)
New-Item -ItemType Directory -Force -Path $dstDir | Out-Null

# Creatures: (name, animStyle) where animStyle is 'idle_run' or 'anim_only'
$creatures = @(
    @{ name = 'knight_m';       style = 'idle_run' },
    @{ name = 'goblin';         style = 'idle_run' },
    @{ name = 'tiny_zombie';    style = 'idle_run' },
    @{ name = 'imp';            style = 'idle_run' },
    @{ name = 'swampy';         style = 'anim_only' },
    @{ name = 'skelet';         style = 'idle_run' },
    @{ name = 'orc_warrior';    style = 'idle_run' },
    @{ name = 'masked_orc';     style = 'idle_run' },
    @{ name = 'wogol';          style = 'idle_run' },
    @{ name = 'slug';           style = 'anim_only' },
    @{ name = 'necromancer';    style = 'anim_only' },
    @{ name = 'muddy';          style = 'anim_only' },
    @{ name = 'ice_zombie';     style = 'anim_only' },
    @{ name = 'pumpkin_dude';   style = 'idle_run' },
    @{ name = 'lizard_f';       style = 'idle_run' },
    @{ name = 'chort';          style = 'idle_run' },
    @{ name = 'big_demon';      style = 'idle_run' },
    @{ name = 'big_zombie';     style = 'idle_run' },
    @{ name = 'ogre';           style = 'idle_run' }
)

foreach ($c in $creatures) {
    $name = $c.name
    $style = $c.style

    if ($style -eq 'idle_run') {
        $framePaths = @(
            (Join-Path $srcDir "${name}_idle_anim_f0.png"),
            (Join-Path $srcDir "${name}_idle_anim_f1.png"),
            (Join-Path $srcDir "${name}_idle_anim_f2.png"),
            (Join-Path $srcDir "${name}_idle_anim_f3.png"),
            (Join-Path $srcDir "${name}_run_anim_f0.png"),
            (Join-Path $srcDir "${name}_run_anim_f1.png"),
            (Join-Path $srcDir "${name}_run_anim_f2.png"),
            (Join-Path $srcDir "${name}_run_anim_f3.png")
        )
    } else {
        $framePaths = @(
            (Join-Path $srcDir "${name}_anim_f0.png"),
            (Join-Path $srcDir "${name}_anim_f1.png"),
            (Join-Path $srcDir "${name}_anim_f2.png"),
            (Join-Path $srcDir "${name}_anim_f3.png"),
            (Join-Path $srcDir "${name}_anim_f0.png"),
            (Join-Path $srcDir "${name}_anim_f1.png"),
            (Join-Path $srcDir "${name}_anim_f2.png"),
            (Join-Path $srcDir "${name}_anim_f3.png")
        )
    }

    foreach ($p in $framePaths) {
        if (-not (Test-Path $p)) { Write-Error "Missing frame: $p"; exit 1 }
    }

    $firstFrame = [System.Drawing.Image]::FromFile($framePaths[0])
    $fw = $firstFrame.Width
    $fh = $firstFrame.Height
    $firstFrame.Dispose()

    $stripW = $fw * 8
    $stripH = $fh
    $bitmap = New-Object System.Drawing.Bitmap $stripW, $stripH, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bitmap)
    $g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None

    for ($i = 0; $i -lt 8; $i++) {
        $img = [System.Drawing.Image]::FromFile($framePaths[$i])
        $g.DrawImage($img, ($i * $fw), 0, $fw, $fh)
        $img.Dispose()
    }

    $outPath = Join-Path $dstDir "$name.png"
    $bitmap.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bitmap.Dispose()

    Write-Host "wrote $name.png ($stripW x $stripH)"
}

Write-Host "done - wrote $($creatures.Count) strips to $dstDir"
