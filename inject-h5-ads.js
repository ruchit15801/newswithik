const fs = require('fs');
const path = require('path');

const gamesDir = path.join(__dirname, 'games');

const adsCode = `
<!-- Google AdSense Auto Ads / H5 Ad Placement API -->
<script async data-ad-frequency-hint="30s" src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9408433736996330" crossorigin="anonymous"></script>
<script>
    window.adsbygoogle = window.adsbygoogle || [];
    var adBreak = adConfig = function(o) {adsbygoogle.push(o);}
</script>
`;

function injectAds(dir) {
    let files;
    try {
        files = fs.readdirSync(dir);
    } catch (e) {
        return;
    }
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        let stat;
        try {
            stat = fs.statSync(fullPath);
        } catch (e) {
            continue;
        }

        if (stat.isDirectory()) {
            injectAds(fullPath);
        } else if (file.toLowerCase() === 'index.html') {
            try {
                let content = fs.readFileSync(fullPath, 'utf8');
                
                // Avoid double injection
                if (!content.includes('data-ad-frequency-hint="30s"') && !content.includes('adBreak = adConfig = function(o)')) {
                    
                    // Insert just before </head> or inside <head>
                    if (content.includes('</head>')) {
                        content = content.replace('</head>', adsCode + '</head>');
                        fs.writeFileSync(fullPath, content, 'utf8');
                        console.log(`Injected Ads into: ${fullPath}`);
                    } else if (content.includes('<head>')) {
                        content = content.replace('<head>', '<head>' + adsCode);
                        fs.writeFileSync(fullPath, content, 'utf8');
                        console.log(`Injected Ads into: ${fullPath}`);
                    }
                }
            } catch (e) {
                console.error(`Failed to process ${fullPath}: ${e.message}`);
            }
        }
    }
}

console.log('Starting Ad Injection...');
injectAds(gamesDir);
console.log('Finished Ad Injection!');
