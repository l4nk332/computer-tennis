# Computer Tennis


## Overview
*Computer Tennis* is an in-browser game that implements the [HTML Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) to recreate and add a variety of features to the classic game [*Pong*](https://en.wikipedia.org/wiki/Pong).

Here is a link to the most recent version of *Computer-Tennis*: [Play Now!](https://computer-tennis.herokuapp.com/)

## Gameplay

![Computer-Tennis Main Menu](https://github.com/l4nk332/computer-tennis/blob/master/img/3_modes.png)
![Computer-Tennis Gameplay](https://github.com/l4nk332/computer-tennis/blob/master/img/1_us-open.png)

### Objective
The objective of the game is to prevent the ball from getting past your paddle fewer times than your oppenent (much like classic Pong).

As you rally back and forth the velocity of the ball will increase with each collision. When you lose a rally your paddle gets smaller by a fixed percentage, and if you win the rally your paddle will increase by half of that fixed percentage (unless at original paddle size).

### Controls
Currently both players must play on the same computer, however, soon [Socket.io](http://socket.io/) will be implemented, allowing the ability to play remotely.

<table>
  <thead>
    <tr>
      <th>Control</th>
      <th>Player 1</th>
      <th>Player 2</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Left</td>
      <td>&leftarrow;</td>
      <td>A</td>
      <td>Moves paddle left</td>
    </tr>
    <tr>
      <td>Right</td>
      <td>&rightarrow;</td>
      <td>D</td>
      <td>Moves paddle right</td>
    </tr>
    <tr>
      <td>Sprint</td>
      <td>&downarrow;</td>
      <td>S</td>
      <td>Increase paddle L/R speed (hold)</td>
    </tr>
    <tr>
      <td>Reverse Spin</td>
      <td>&uparrow;</td>
      <td>W</td>
      <td>Reverse ball direction (hold)</td>
    </tr>
  </tbody>
</table>

### Modes

There are currently 3 unique visual modes, each with additional settings that can be adjusted regarding SFX or courts:

1. **Tennis** - A tennis-like aesthetic that has the option for *tennis grunt* or *tennis racket* SFX. The courts available pertain to the [Grand Slam of Tennis](https://en.wikipedia.org/wiki/Grand_Slam_(tennis)) and their respective color schemes:
  * [Australian Open](https://en.wikipedia.org/wiki/Australian_Open)
  * [French Open](https://en.wikipedia.org/wiki/French_Open)
  * [Wimbledon](https://en.wikipedia.org/wiki/The_Championships,_Wimbledon)
  * [US Open](https://en.wikipedia.org/wiki/US_Open_(tennis))

2. **Classic** - The original look and sound of classic [*Pong*](https://en.wikipedia.org/wiki/Pong).

3. **Chromatic** - An experimental mode with a more modern soundscape, and a ball that changes color on each collision.

## Challenges

**Euclidean Geometry**

![Point of intersection](https://upload.wikimedia.org/wikipedia/commons/d/d7/Is-linesegm.svg)
![Euclidean Formula](https://wikimedia.org/api/rest_v1/media/math/render/svg/3db2304cc7f523a02ff2f1ca1629505004538ddf)

One of the biggest challenges I encountered when building this game was the [collision detection](https://en.wikipedia.org/wiki/Collision_detection). Through the implementation of [Euclidean Geometry](https://en.wikipedia.org/wiki/Intersection_(Euclidean_geometry)) I was able to find the point of intersection between two line segments. Given this point of intersection I had to check whether it was within the bounds of the canvas and whether it was at or beyond a point of collision. Naturally I inverted the velocities along the X and Y axes depending on which side of the canvas the collision had occured and then incremented the velocity accordingly.

**OOP Design Pattern**

Building this application required a well designed [Object-Oriented](https://en.wikipedia.org/wiki/Object-oriented_programming) API for rendering the canvas, asynchronously handling key-press events, and modelling the game itself. The difficulty lied in breaking things into encapsulated components (i.e Game, Board, Player, Ball) so that no one given component directly relied on another. In the beginning this was quite simple, making it managable to write unit tests, however, as features and functionalities began to be added it became challenging to delegate the correct interactions to their corresponding components. Overall, much time has been spent refactoring the code into a more scalable, atomic application in which components can function independently and yet still communicate and interact accordingly.


## Further Expansion

**Remote Gameplay**

The next step for *Computer-Tennis* is to implement [Socket.io](http://socket.io/) to allow two players to compete remotely. This would require additional logic to ensure synchronous behavior and rendering on both clients. Additionally it would involve designing a way to create unique rooms in which players can be segregated into when a game is initialized. Most likely the way in which two players would connect is through a unique hashed url that would correspond to a room. PlayerA would send that url to PlayerB and when both players are ready the game would begin.

**New Physics**

Encorporating new physics into the game would alter the behavior of the ball at certain points of collision, adding a new element of stategy. This might involve altering the trajectory of the ball into a quadratic curve or perhaps complete redirection of the ball's path.

## Contribution

If you'd like to contribute to this project or fork it feel free! Collaborators are always welcome 👍
