Plot Goal: The user can turn on or off a lamp in each view. If they have the correct subset of lamps turned on and the corect subset of lamps turned off at the same time then the puzzle is solved.

There will be 4 clues scattered around the room each will be encoded in a variation of the pigpen cipher. There is an example in the pigpen cipher.jpg. We will also need to put the cipher key in the puzzle as a clue. 

## Images we need to generate are:

*  8 differen mini scenes: an on and off version of each of the 4 lamps. Clickling on the lamps turns them on or off.
    *  Implementation note: We can make one mini scene and use different lamp images.
*  The four clues on slips of paper.
* cipher key for the pigpen cipher

Clue 1:
"circle off" in the pigpen cipher.
It will be found behind the painting in the east view.
When clicked on the item should be added to the inventory and a zoom view should pop up. This is where we will use the generated image of clue 1.

Clue 2:
"triangle on" in the pigpen cipher.
It will be found under the matress in the east view.
When clicked on the item should be added to the inventory and a zoom view should pop up. This is where we will use the generated image of clue 2.

Clue 3:
"cross on" in the pigpen cipher.
It will be found on the writing desk in the south view.
When clicked on the item should be added to the inventory and a zoom view should pop up. This is where we will use the generated image of clue 3.

Clue 4:
"spiral on" in the pigpen cipher.
It will be found in the stack of books underneath the mug in the north view.
When clicked on the item should be added to the inventory and a zoom view should pop up. This is where we will use the generated image of clue 4.

Each light will have a patern on it when viewed from the zoom veiws, either an X, a circle, a triangle or a spiral. The clues will tell the user which lights should be on or off based on this pattern. To solve the puzzle the lamp with a circle on it should be off while the other three should be on.

# Impementation constraints

There should be no new added. Just add hotspots over existing elements in the bacground images.