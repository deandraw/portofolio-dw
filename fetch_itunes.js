const fs = require('fs');

const queries = [
    { title: 'Kacamata', artist: 'Afgan' },
    { title: 'Firasat', artist: 'Marcell' },
    { title: 'Circles', artist: 'Durand Jones & The Indications' },
    { title: 'This Love', artist: 'Maroon 5' },
    { title: 'B.E.D', artist: 'Jacquees' },
    { title: "The Man Who Can't Be Moved", artist: 'The Script' },
    { title: 'Toronto 2014', artist: 'Daniel Caesar' },
    { title: 'Trust Issues', artist: 'Drake' },
    { title: 'Englishman In New York', artist: 'Sting' },
    { title: 'Kiss of Life', artist: 'Sade' },
    { title: 'MUTT', artist: 'Leon Thomas' },
];

async function fetchTracks() {
    let results = [];
    for (let q of queries) {
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q.title + ' ' + q.artist)}&limit=1&media=music`;
        console.log('Fetching', url);
        try {
            const res = await fetch(url);
            const data = await res.json();
            if (data.results && data.results.length > 0) {
                const track = data.results[0];
                results.push({
                    title: q.title,
                    artist: q.artist,
                    cover: track.artworkUrl100 ? track.artworkUrl100.replace('100x100bb', '600x600bb') : '',
                    preview: track.previewUrl || ''
                });
            } else {
                console.log('Not found:', q.title);
                results.push({ ...q, cover: '', preview: '' });
            }
        } catch (e) {
            console.error(e);
        }
    }
    fs.writeFileSync('C:/Users/LOQ GAMING/.gemini/antigravity/scratch/deandra-portfolio/songs_data.json', JSON.stringify(results, null, 2));
    console.log('Done.');
}
fetchTracks();
