- submission takes too much time:
    the image(snap) is uploaded on clicking submit; it should be uploaded right on the submit page
- cloudinary delete is inconsistent on image upload
- no image optimization, our cv uses 512 dimentions np array for images for which we upload actual images which is unnecessary 
- cv has too much latency (> 10s): this might be because it has to fetch docs itself, and also communicate with the clip api for comparing; maybe the algorithm can be improved; i.e. comparing against chunked average or just few images; or just the cover images; 
there's something wrong with the splash screen,
the location focus btn on explore page overlaps the bottom sheet, - FIXED: MapControls anchors above the peeked sheet height (15% of window) instead of a fixed 140px
the collection cards dont show anything(link them to the story viewing page),
the community apis arent used(use them in the artifact detail unlocked page to show what others clicked add small bar having thumbnails of community images and a lil view all link that takes to the gallery by community)
the map flickers i.e. when we start navigating, it rerenders and zooms out all of a sudden - FIXED: Camera zoom no longer controlled per-render; initial view (center/zoom 15) set via initialViewState once
- the submit page has no good loading ui: it just shows the "Submitting..." button state so users dont know whats happening; there are 3 steps that might happen (public photos uploading, verifying snap, submitting snap) - a staged loading ui would be better