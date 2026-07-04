export const TreehouseConfig = {
  roomName: "Escape the Treehouse",
  initialView: "north",
  
  views: {
    north: {
      backgroundImage: "bg_north",
      hotspots: [
        {
          name: "hammock",
          rect: [260, 290, 370, 180],
          interactions: [
            {
              if_flag: "!found_paper",
              then: [
                "SET_FLAG: found_paper",
                "ADD_INVENTORY: origami_paper",
                "SHOW_DIALOG: Underneath the pillow, you find a sheet of paper."
              ]
            },
            {
              else: [
                "SHOW_DIALOG: A comfortable hammock. There's nothing else under the pillow."
              ]
            }
          ]
        },
        {
          name: "bookshelves",
          rect: [860, 180, 200, 260],
          interactions: [
            {
              if_flag: "!found_book",
              then: [
                "SET_FLAG: found_book",
                "ADD_INVENTORY: origami_book",
                "SHOW_DIALOG: You search the bookshelves and find an Origami Guide."
              ]
            },
            {
              else: [
                "SHOW_DIALOG: Various novels and guides about forest lore."
              ]
            }
          ]
        },
        {
          name: "trunk",
          rect: [820, 370, 260, 140],
          interactions: [
            {
              else: [
                "SHOW_DIALOG: It's a heavy iron-banded trunk. The padlock is rusted shut and won't budge. There doesn't seem to be a way to open it."
              ]
            }
          ]
        }
      ]
    },

    east: {
      backgroundImage: "bg_east",
      hotspots: [
        {
          name: "trees_book_shelf",
          rect: [75, 85, 150, 130],
          interactions: [
            {
              if_flag: "!found_trees_book",
              then: [
                "SET_FLAG: found_trees_book",
                "ADD_INVENTORY: trees_book",
                "REFRESH_GRAPHICS",
                "SHOW_DIALOG: On a small wooden shelf on the wall, you find a book titled 'Trees of North America'."
              ]
            },
            {
              else: [
                "SHOW_DIALOG: A small wooden shelf on the wall."
              ]
            }
          ]
        },
        {
          name: "window_sill",
          rect: [605, 260, 60, 60],
          interactions: [
            {
              if_flag: "!found_binoculars",
              then: [
                "SET_FLAG: found_binoculars",
                "ADD_INVENTORY: binoculars",
                "REFRESH_GRAPHICS",
                "SHOW_DIALOG: On the window sill, you find a pair of binoculars."
              ]
            },
            {
              else: [
                "SHOW_DIALOG: Various plants sit on the window sill."
              ]
            }
          ]
        }
      ]
    },

    south: {
      backgroundImage: "bg_south",
      hotspots: [
        {
          name: "exit_door",
          rect: [185, 270, 230, 340],
          interactions: [
            {
              if_flag: "door_unlocked",
              then: ["TRIGGER_WIN"]
            },
            {
              if_selected_item: "rusty_key",
              then: [
                "SET_FLAG: door_unlocked",
                "REMOVE_INVENTORY: rusty_key",
                "SHOW_DIALOG: You insert the rusty old key into the padlock. With a heavy creak, the lock snaps open and the door swings open! Click again to exit."
              ]
            },
            {
              else: [
                "SHOW_DIALOG: The exit door is locked tight. The padlock is extremely old and rusty."
              ]
            }
          ]
        },
        {
          name: "writing_desk",
          rect: [780, 355, 360, 170],
          interactions: [
            {
              else: [
                "SHOW_DIALOG: A cozy writing desk with some inkwells and loose sheets of scrap paper."
              ]
            }
          ]
        },
        {
          name: "south_window",
          rect: [715, 190, 370, 180],
          interactions: [
            {
              else: ["OPEN_ZOOM_VIEW: south_window_zoom"]
            }
          ]
        },
        {
          name: "dartboard_safe_zone",
          rect: [380, 205, 120, 120],
          interactions: [
            {
              if_flag: "safe_unlocked",
              then: [
                "LAUNCH_MINIGAME: open_safe_compartment",
                "OPEN_ZOOM_VIEW: safe_view"
              ]
            },
            {
              if_flag: "dartboard_solved",
              then: [
                "OPEN_ZOOM_VIEW: safe_view"
              ]
            },
            {
              else: [
                "OPEN_ZOOM_VIEW: dartboard_view"
              ]
            }
          ]
        }
      ]
    }
  },

  zoomViews: {
    origami_paper: { title: "A sheet of paper", asset: "graphics_built_card" },
    origami_book: { title: "Origami Guide", asset: "open_origami_book" },
    paper_airplane: { title: "Folded Paper Airplane", asset: "paper_airplane_clue" },
    trees_book: { title: "Trees of North America", asset: "open_book" }
  },

  minigames: {
    dartboard_view: {
      type: "sequential_sequence",
      target: [13, 20, 10],
      onSuccess: [
        "SET_FLAG: dartboard_solved",
        "REMOVE_INVENTORY: paper_airplane",
        "OPEN_ZOOM_VIEW: safe_view"
      ]
    },
    safe_view: {
      type: "thumb_wheels",
      combination: "1759",
      onSuccess: [
        "SET_FLAG: safe_unlocked",
        "REFRESH_GRAPHICS",
        "SHOW_DIALOG: With a heavy mechanical click, the safe swings open, revealing a Rusty Old Key inside! The Rusty Old Key has been added to your inventory."
      ]
    }
  }
};
