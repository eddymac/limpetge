fuenction do_onload()
{
    document.getElementById("ex3").innerText =
`class Sphere {
    constructor(color)
    {
        this.obj = new LWObject(g_structures.Sphere[color], this);
        this.obj.mkvisible(false);
        lScene.lPlace(this.obj, mat4.create());
        this.velocity = 0;  // To be created in "makesphere"
    
        // For celebrating
        this.endx = g_prngd.next(20) - 10;
        this.endy = g_prngd.next(20) - 10;
        this.endz = g_prngd.next(20) - 10;
    }

    start()
    {
        this.velocity = 5.0 + g_prngd.next(5.0);    // Set velocity between 5 and 10

        /*
         * Move to - X = laterally somewhere random in the corridor, not touching the walls
         *           Y = Center of sphere 1 
         *           Z = Start of run
         */
        var x = 19 - g_prngd.next(38);  // Get a number between -19 and 19
        if(x > 18) x = 18;  // Cannot be grater than 18
        if(x < -18) x = -18;  // or less than -18
        this.obj.moveHere(x, 0,  -110);

        // Make sure it is not hitting anything, If it is move back 2.1
        // Wash rinse repeat...

        var collision = false;
        function _see(cob)
        {
            collision = true;
        }
        for(;;) {
            this.obj.warp();    // Warp here - no ray tracing
            collision = false;
            lScene.lCAllDynamicPointDetect(this.obj, 2.0, _see);
            if(collision) {
                this.obj.moveAbs(0, 0, -2.1);
            } else {
                break;
            }
        }

        // Has already warped here in for loop, if have not need to do this
        // otherwise ray tracing occurs from where it last was!.
        this.obj.mkvisible(true);
        this.obj.procpos();
    }

    /*
     * What happens when a sphere moves
     */
    move(delta)
    {

        /*
         * Adjust the velocity to that of the sphere
         */

        delta *= this.velocity;

        if(!this.obj.isvisible) return;

        /*
         * Moving, spheres roll, so cannot use the "move" or "moveFlat" methods
         * as they move in the direction the object is pointing, which can be 
         * anywhere as it rolls.
         * A quick and dirty way to "fix" this is to use the "moveAbs" method
         * which moves relative to the scene (or the origin).  As we are only
         * moving one way (down Z axis, positive) we can get away with that here.
         * A more "correct" solution, that llows proper rolling, is in the next tutorial.
         */
    
        this.obj.moveAbs(0, 0, delta);


        /*
         * Since we mentioned it, lets roll this.
         * You cannot see that if a single color, but put a texture on the sphere...
         *
         * divide by 2 * Pi * radius so it rolls the speed it is travelling
         */

        this.obj.rotate(delta/ 2, 0, 0);

        /*
         * In LimpetGE it is really the object that has moved responsibility
         * to see if it has hit anything...
         *  Here, spheres can either hit the camera or another sphere
         */

        var hitsphere = null;
        function _see(cob) {
            if(cob.control instanceof LCamera) {
                lScene.ishit = true;        // Hit camera - Game over
            } else if (cob.control instanceof Sphere) {
                hitsphere = cob.control;
            }
        }
        lScene.lCAllPointDetect(this.obj, 2.0, _see);

        if(hitsphere) {
            // First move back
            this.obj.moveAbs(0, 0, -delta);
            this.obj.rotate(-delta / 2, 0, 0);

            // Then swap velocity
            if(this.velocity > hitsphere.velocity) {
                var temp = this.velocity;
                this.velocity = hitsphere.velocity;
                hitsphere.velocity = temp;
            }
        }

        // If we are off the edge, die

        this.obj.procpos();

        if(this.obj.z > 220) this.die();
    }

    die()
    {
        // Just make invisible for this game
        this.obj.mkvisible(false);
    }

}`;



}
