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
          rect: [850, 170, 210, 260],
          interactions: [
            {
              if_flag: "!found_book",
              then: [
                "SET_FLAG: found_book",
                "ADD_INVENTORY: origami_book",
                "SHOW_DIALOG: You found an Origami book."
              ]
            },
            {
              else: [
                "SHOW_DIALOG: Various novels and guides."
              ]
            }
          ]
        },
        {
          name: "north_lamp",
          rect: [440, 57, 70, 115],
          interactions: [
            {
              else: ["OPEN_ZOOM_VIEW: triangle_lamp_zoom_view"]
            }
          ]
        },
        {
          name: "trunk",
          rect: [800, 380, 240, 120],
          interactions: [
            {
              else: [
                "SHOW_DIALOG: It's a heavy iron-banded trunk. It is locked and you don't have a key."
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
                "SHOW_DIALOG: You found a book titled 'Trees of North America' on the shelf."
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
          name: "binoculars",
          rect: [592, 282, 58, 58],
          interactions: [
            {
              if_flag: "!found_binoculars",
              then: [
                "SET_FLAG: found_binoculars",
                "ADD_INVENTORY: binoculars",
                "REFRESH_GRAPHICS",
                "SHOW_DIALOG: You found a pair of binoculars on the window sill."
              ]
            },
            {
              else: [
                "SHOW_DIALOG: A shelf under the window sill."
              ]
            }
          ]
        },
        {
          name: "east_lamp",
          rect: [42, 292, 84, 126],
          interactions: [
            {
              else: ["OPEN_ZOOM_VIEW: circle_lamp_zoom_view"]
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
              then: ["SET_VIEW: balcony"]
            },
            {
              if_selected_item: "rusty_key",
              then: [
                "SET_FLAG: door_unlocked",
                "REMOVE_INVENTORY: rusty_key",
                "SHOW_DIALOG: You have inserted the rusty old key into the lock. The door is now unlocked, click again to go through."
              ]
            },
            {
              else: [
                "SHOW_DIALOG: The door is locked."
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
                "SHOW_DIALOG: A cozy writing desk with inkwells and scrap paper."
              ]
            }
          ]
        },
        {
          name: "south_lamp",
          rect: [495, 66, 42, 109],
          interactions: [
            {
              else: ["OPEN_ZOOM_VIEW: cross_lamp_zoom_view"]
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
          rect: [366, 171, 118, 96],
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
    },

    balcony: {
      backgroundImage: "bg_balcony",
      hotspots: [
        {
          name: "exit_door",
          rect: [781, 246, 181, 355],
          interactions: [
            {
              else: [
                "SET_VIEW: south"
              ]
            }
          ]
        },
        {
          name: "pinned_note",
          rect: [621, 186, 56, 74],
          interactions: [
            {
              if_flag: "!found_cipher_key",
              then: [
                "SET_FLAG: found_cipher_key",
                "ADD_INVENTORY: cipher_key",
                "OPEN_ZOOM_VIEW: cipher_key_zoom",
                "SHOW_DIALOG: You take the pinned note from the wall. It appears to be a key for translating the strange symbols."
              ]
            },
            {
              else: [
                "SHOW_DIALOG: The wall where the note was pinned."
              ]
            }
          ]
        },
        {
          name: "zipline",
          rect: [530, 123, 60, 60],
          interactions: [
            {
              else: [
                "SHOW_DIALOG: A zipline overlooking the forest. It looks like a fast way down, but I need a harness to use it safely."
              ]
            }
          ]
        },
        {
          name: "balcony_lamp",
          rect: [904, 291, 73, 163],
          interactions: [
            {
              else: ["OPEN_ZOOM_VIEW: spiral_lamp_zoom_view"]
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
    trees_book: { title: "Trees of North America", asset: "open_book" },
    cipher_key_zoom: { title: "Cipher Key", asset: "cipher_key_zoom" },
    triangle_lamp_zoom_view: { title: "North Lamp (Triangle)", asset: "triangle_lamp_zoom_view" },
    circle_lamp_zoom_view: { title: "East Lamp (Circle)", asset: "circle_lamp_zoom_view" },
    cross_lamp_zoom_view: { title: "South Lamp (Cross)", asset: "cross_lamp" },
    spiral_lamp_zoom_view: { title: "Balcony Lamp (Spiral)", asset: "spiral_lamp_zoom_view" }
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
