frontend:
1. the story or description in artifact details isnt md parsed so we need md format parsing
2. pressing the back button in header takes to a dummy homepage instead of the actual homepage
3. the profile menu contains 2 logout buttons ; one directly on the menu, another inside the settings; the one on the settings works but the one on the menu doesn't work, so keep the one in the settings that works, and remove the one on the menu that doesnt work
4. the uer collectionpage shows broken cards, their layout is not properly managed

more work:
5. there is no caching in the frontend, we want it as much offline as possible
6. the proximity alert feature is not tested and we dont know if it works
7. in the first project detail(story locked) page, the quest rarity and the xp arent loaded from db so it gives undefined

backend:
in image upload, webp image format isnt accepted