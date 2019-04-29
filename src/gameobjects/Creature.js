/* eslint-disable camelcase */
/* globals Creature,CreatureAnimation,CreatureManager,CreatureModuleUtils */
/**
* @author       Richard Davey <rich@photonstorm.com>
* @author       Kestrel Moon Studios <creature@kestrelmoon.com>
* @copyright    2016 Photon Storm Ltd and Kestrel Moon Studios
* @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
*/


/**
 * @class CreatureShader
 * @constructor
 * @param gl {WebGLContext} the current WebGL drawing context
 */
PIXI.CreatureShader = function (gl)
{
    /**
   * @property _UID
   * @type Number
   * @private
   */
    this._UID = Phaser._UID++;

    /**
   * @property gl
   * @type WebGLContext
   */
    this.gl = gl;

    /**
   * The WebGL program.
   * @property program
   * @type Any
   */
    this.program = null;

    /**
   * The fragment shader.
   * @property fragmentSrc
   * @type Array
   */
    this.fragmentSrc = [
        '//CreatureShader Fragment Shader.',
        'precision mediump float;',
        'varying vec2 vTextureCoord;',
        'varying float vTextureIndex;',
        'varying vec4 vColor;',

        // 'uniform float alpha;',
        // 'uniform vec3 tint;',
        'uniform sampler2D uSampler;',
        'void main(void) {',
        '   gl_FragColor = texture2D(uSampler, vTextureCoord) * vColor;',
        '}'
    ];

    /**
   * The vertex shader.
   * @property vertexSrc
   * @type Array
   */
    this.vertexSrc = [
        '//CreatureShader Vertex Shader.',
        'attribute vec2 aVertexPosition;',
        'attribute vec2 aTextureCoord;',
        'attribute float aTextureIndex;',
        'attribute vec4 aColor;',
        'uniform mat3 translationMatrix;',
        'uniform vec2 projectionVector;',
        'uniform vec2 offsetVector;',
        'uniform float alpha;',
        'uniform vec3 tint;',
        'varying vec2 vTextureCoord;',
        'varying float vTextureIndex;',
        'varying vec4 vColor;',

        'void main(void) {',
        '   vec3 v = translationMatrix * vec3(aVertexPosition , 1.0);',
        '   v -= offsetVector.xyx;',
        '   gl_Position = vec4( v.x / projectionVector.x -1.0, v.y / -projectionVector.y + 1.0 , 0.0, 1.0);',
        '   vTextureCoord = aTextureCoord;',
        '   vTextureIndex = aTextureIndex;',
        '   vColor = vec4(tint[0], tint[1], tint[2], 1.0) * aColor.a * alpha;',
        '}'
    ];

    this.init();
};

PIXI.CreatureShader.prototype.constructor = PIXI.CreatureShader;

/**
 * Initialises the shader.
 *
 * @method PIXI.CreatureShader#init
 */
PIXI.CreatureShader.prototype.init = function ()
{
    var gl = this.gl;
    var program = PIXI.compileProgram(gl, this.vertexSrc, this.fragmentSrc);
    gl.useProgram(program);

    // get and store the uniforms for the shader
    this.uSampler = PIXI._enableMultiTextureToggle ?
        gl.getUniformLocation(program, 'uSamplerArray[0]') :
        gl.getUniformLocation(program, 'uSampler');


    this.projectionVector = gl.getUniformLocation(program, 'projectionVector');
    this.offsetVector = gl.getUniformLocation(program, 'offsetVector');
    this.colorAttribute = gl.getAttribLocation(program, 'aColor');
    this.aTextureIndex = gl.getAttribLocation(program, 'aTextureIndex');

    // this.dimensions = gl.getUniformLocation(this.program, 'dimensions');

    // get and store the attributes
    this.aVertexPosition = gl.getAttribLocation(program, 'aVertexPosition');
    this.aTextureCoord = gl.getAttribLocation(program, 'aTextureCoord');

    this.attributes = [ this.aVertexPosition, this.aTextureCoord, this.colorAttribute ];

    this.translationMatrix = gl.getUniformLocation(program, 'translationMatrix');
    this.alpha = gl.getUniformLocation(program, 'alpha');
    this.tintColor = gl.getUniformLocation(program, 'tint');

    this.program = program;
};

/**
 * Destroys the shader.
 *
 * @method PIXI.CreatureShader#destroy
 */
PIXI.CreatureShader.prototype.destroy = function ()
{
    this.gl.deleteProgram(this.program);
    this.uniforms = null;
    this.gl = null;

    this.attribute = null;
};


/**
* Creature is a custom Game Object used in conjunction with the Creature Runtime libraries by Kestrel Moon Studios.
*
* It allows you to display animated Game Objects that were created with the [Creature Automated Animation Tool](http://www.kestrelmoon.com/creature/).
*
* Note 1: You can only use Phaser.Creature objects in WebGL enabled games. They do not work in Canvas mode games.
*
* Note 2: You must use a build of Phaser that includes the CreatureMeshBone.js runtime and gl-matrix.js, or have them
* loaded before your Phaser game boots.
*
* See the Phaser custom build process for more details.
*
* By default the Creature runtimes are NOT included in any pre-configured version of Phaser.
*
* So you'll need to do `grunt custom` to create a build that includes them.
*
* @class Phaser.Creature
* @extends PIXI.DisplayObjectContainer
* @extends Phaser.Component.Core
* @extends Phaser.Component.Angle
* @extends Phaser.Component.AutoCull
* @extends Phaser.Component.BringToTop
* @extends Phaser.Component.Destroy
* @extends Phaser.Component.FixedToCamera
* @extends Phaser.Component.LifeSpan
* @extends Phaser.Component.Reset
* @extends Phaser.Component.InputEnabled
* @constructor
* @param {Phaser.Game} game - A reference to the currently running game.
* @param {number} x - The x coordinate of the Game Object. The coordinate is relative to any parent container this Game Object may be in.
* @param {number} y - The y coordinate of the Game Object. The coordinate is relative to any parent container this Game Object may be in.
* @param {string|PIXI.Texture} key - The texture used by the Creature Object during rendering. It can be a string which is a reference to the Cache entry, or an instance of a PIXI.Texture.
* @param {string} mesh - The mesh data for the Creature Object. It should be a string which is a reference to the Cache JSON entry.
* @param {string} [animation='default'] - The animation within the mesh data  to play.
* @param {string} [useFlatData=false] - Use flat data
*/
Phaser.Creature = function (game, x, y, key, mesh, animation, useFlatData)
{

    /**
     * @property {Phaser.Game} game - A reference to the currently running game.
     */
    this.game = game;

    if (animation === undefined) { animation = 'default'; }
    if (useFlatData === undefined) { useFlatData = false; }

    /**
    * @property {number} type - The const type of this object.
    * @readonly
    */
    this.type = Phaser.CREATURE;

    if (!game.cache.checkJSONKey(mesh))
    {
        console.warn('Phaser.Creature: Invalid mesh key given. Not found in Phaser.Cache');
        return;
    }

    var meshData = game.cache.getJSON(mesh, true);

    /**
    * @property {Creature} _creature - The Creature instance.
    * @private
    */
    this._creature = new Creature(meshData, useFlatData);

    /**
    * @property {CreatureAnimation} animation - The CreatureAnimation instance.
    */
    this.animation = new CreatureAnimation(meshData, animation, useFlatData);

    /**
    * @property {CreatureManager} manager - The CreatureManager instance for this object.
    */
    this.manager = new CreatureManager(this._creature);

    /**
    * @property {number} timeDelta - How quickly the animation advances.
    * @default
    */
    this.timeDelta = 0.05;

    if (typeof key === 'string')
    {
        var texture = new PIXI.Texture(game.cache.getBaseTexture(key));
    }
    else
    {
        var texture = key;
    }

    /**
    * @property {PIXI.Texture} texture - The texture the animation is using.
    */
    this.texture = texture;

    PIXI.DisplayObjectContainer.call(this);

    this.dirty = true;
    this.blendMode = PIXI.blendModes.NORMAL;

    /**
    * @property {Phaser.Point} creatureBoundsMin - The minimum bounds point.
    * @protected
    */
    this.creatureBoundsMin = new Phaser.Point();

    /**
    * @property {Phaser.Point} creatureBoundsMax - The maximum bounds point.
    * @protected
    */
    this.creatureBoundsMax = new Phaser.Point();

    var target = this.manager.target_creature;

    /**
    * @property {Float32Array} vertices - The vertices data.
    * @protected
    */
    this.vertices = new Float32Array(target.total_num_pts * 2);

    /**
    * @property {Float32Array} uvs - The UV data.
    * @protected
    */
    this.uvs = new Float32Array(target.total_num_pts * 2);

    /**
    * @property {Uint16Array} indices
    * @protected
    */
    this.indices = new Uint16Array(target.global_indices.length);

    for (var i = 0; i < this.indices.length; i++)
    {
        this.indices[i] = target.global_indices[i];
    }

    /**
    * @property {Uint16Array} colors - The vertices colors
    * @protected
    */
    this.colors = new Float32Array(target.total_num_pts*4);
    for(var j = 0; j < this.colors.length; j++)
    {
        this.colors[j] = 1.0;
    }

    this.updateRenderData(target.global_pts, target.global_uvs);

    this.manager.AddAnimation(this.animation);
    this.manager.SetActiveAnimationName(animation, false);

    Phaser.Component.Core.init.call(this, game, x, y);


    /**
    * @property {number} tint - colour change
    * @default
    */
    this.data.tint = 0xFFFFFF;

    /**
    * @property {number} alpha - set the opacity
    * @default
    */
    this.data.alpha = 1.0;

};

Phaser.Creature.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
Phaser.Creature.prototype.constructor = Phaser.Creature;

Phaser.Component.Core.install.call(Phaser.Creature.prototype, [
    'Angle',
    'AutoCull',
    'BringToTop',
    'Destroy',
    'FixedToCamera',
    'LifeSpan',
    'Reset',
    'InputEnabled'
]);

Phaser.Creature.prototype.preUpdateInWorld = Phaser.Component.InWorld.preUpdate;
Phaser.Creature.prototype.preUpdateCore = Phaser.Component.Core.preUpdate;

/**
* Automatically called by World.preUpdate.
*
* @method Phaser.Creature#preUpdate
* @memberof Phaser.Creature
*/
Phaser.Creature.prototype.preUpdate = function ()
{

    if (!this.preUpdateInWorld())
    {
        return false;
    }

    this.manager.Update(this.timeDelta);

    this.updateData();

    return this.preUpdateCore();

};

/**
*
*
* @method Phaser.Creature#_initWebGL
* @memberof Phaser.Creature
* @private
*/
Phaser.Creature.prototype._initWebGL = function (renderSession)
{

    // build the strip!
    var gl = renderSession.gl;

    this._vertexBuffer = gl.createBuffer();
    this._indexBuffer = gl.createBuffer();
    this._uvBuffer = gl.createBuffer();
    this._colorBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this._uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.uvs, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this._colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.colors, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

};

/**
* @method Phaser.Creature#_renderWebGL
* @memberof Phaser.Creature
* @private
*/
Phaser.Creature.prototype._renderWebGL = function (renderSession)
{

    //  If the sprite is not visible or the alpha is 0 then no need to render this element
    if (!this.visible || this.alpha <= 0)
    {
        return;
    }

    renderSession.spriteBatch.stop();

    // init! init!
    if (!this._vertexBuffer)
    {
        this._initWebGL(renderSession);
    }

    renderSession.shaderManager.setShader(renderSession.shaderManager.creatureShader);

    this._renderCreature(renderSession);

    renderSession.spriteBatch.start();

};

/**
* @method Phaser.Creature#_renderCreature
* @memberof Phaser.Creature
* @private
*/
Phaser.Creature.prototype._renderCreature = function (renderSession)
{

    var gl = renderSession.gl;

    var projection = renderSession.projection;
    var offset = renderSession.offset;
    var shader = renderSession.shaderManager.creatureShader;

    renderSession.blendModeManager.setBlendMode(this.blendMode);

    //  Set uniforms
    gl.uniformMatrix3fv(shader.translationMatrix, false, this.worldTransform.toArray(true));
    gl.uniform2f(shader.projectionVector, projection.x, -projection.y);
    gl.uniform2f(shader.offsetVector, -offset.x, -offset.y);
    gl.uniform1f(shader.alpha, this.worldAlpha);
    gl.uniform3fv(shader.tintColor, Phaser.Color.hexToRGBArray(this.tint));
    gl.uniform1f(shader.alpha, this.alpha);

    if (!this.dirty)
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);
        gl.vertexAttribPointer(shader.aVertexPosition, 2, gl.FLOAT, false, 0, 0);

        //  Update the uvs
        gl.bindBuffer(gl.ARRAY_BUFFER, this._uvBuffer);
        gl.vertexAttribPointer(shader.aTextureCoord, 2, gl.FLOAT, false, 0, 0);

        // Update the colors
        gl.bindBuffer(gl.ARRAY_BUFFER, this._colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.colors, gl.STATIC_DRAW);

        gl.activeTexture(gl.TEXTURE0);

        //  Check if a texture is dirty..
        if (this.texture.baseTexture._dirty[gl.id])
        {
            renderSession.renderer.updateTexture(this.texture.baseTexture);
        }
        else
        {
            //  Bind the current texture
            gl.bindTexture(gl.TEXTURE_2D, this.texture.baseTexture._glTextures[gl.id]);
        }

        //  Don't need to upload!
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
    }
    else
    {
        this.dirty = false;

        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(shader.aVertexPosition, 2, gl.FLOAT, false, 0, 0);

        //  Update the uvs
        gl.bindBuffer(gl.ARRAY_BUFFER, this._uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.uvs, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(shader.aTextureCoord, 2, gl.FLOAT, false, 0, 0);

        // Update the colors
        gl.bindBuffer(gl.ARRAY_BUFFER, this._colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.colors, gl.STATIC_DRAW);
        gl.vertexAttribPointer(shader.colorAttribute, 4, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);

        //  Check if a texture is dirty
        if (this.texture.baseTexture._dirty[gl.id])
        {
            renderSession.renderer.updateTexture(this.texture.baseTexture);
        }
        else
        {
            gl.bindTexture(gl.TEXTURE_2D, this.texture.baseTexture._glTextures[gl.id]);
        }

        //  Don't need to upload!
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
    }

    gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);

};

/**
* @method Phaser.Creature#updateCreatureBounds
* @memberof Phaser.Creature
* @private
*/
Phaser.Creature.prototype.updateCreatureBounds = function ()
{

    //  Update bounds based off world transform matrix
    var target = this.manager.target_creature;

    target.ComputeBoundaryMinMax();

    this.creatureBoundsMin.set(target.boundary_min[0], -target.boundary_min[1]);
    this.creatureBoundsMax.set(target.boundary_max[0], -target.boundary_max[1]);

    this.worldTransform.apply(this.creatureBoundsMin, this.creatureBoundsMin);
    this.worldTransform.apply(this.creatureBoundsMax, this.creatureBoundsMax);

};

/**
* @method Phaser.Creature#updateData
* @memberof Phaser.Creature
* @private
*/
Phaser.Creature.prototype.updateData = function ()
{

    var target = this.manager.target_creature;

    var read_pts = target.render_pts;
    var read_uvs = target.global_uvs;

    this.updateRenderData(read_pts, read_uvs);
    this.updateCreatureBounds();

    this.dirty = true;

};

/**
* @method Phaser.Creature#updateRenderData
* @memberof Phaser.Creature
* @private
*/
Phaser.Creature.prototype.updateRenderData = function (verts, uvs)
{

    var target = this.manager.target_creature;

    var pt_index = 0;
    var uv_index = 0;

    var write_pt_index = 0;

    for (var i = 0; i < target.total_num_pts; i++)
    {
        this.vertices[write_pt_index] = verts[pt_index];
        this.vertices[write_pt_index + 1] = -verts[pt_index + 1];

        this.uvs[uv_index] = uvs[uv_index];
        this.uvs[uv_index + 1] = uvs[uv_index + 1];

        pt_index += 3;
        uv_index += 2;

        write_pt_index += 2;
    }

    // Update color/opacity region values
    var render_composition =
        target.render_composition;
    var regions_map =
        render_composition.getRegionsMap();
    for(var region_name in regions_map)
    {
        var cur_region = regions_map[region_name];
        var start_pt_idx = cur_region.getStartPtIndex();
        var end_pt_idx = cur_region.getEndPtIndex()+1;
        var cur_opacity = cur_region.opacity * 0.01;

        for(var i = (start_pt_idx*4); i <= (end_pt_idx*4); i++)
        {
            this.colors[i] = cur_opacity;
        }
    }

};

/**
* Sets the Animation this Creature object will play, as defined in the mesh data.
*
* @method Phaser.Creature#setAnimation
* @memberof Phaser.Creature
* @param {string} key - The key of the animation to set, as defined in the mesh data.
*/
Phaser.Creature.prototype.setAnimation = function (key)
{

    this.data.anchorY = null;
    this.data.anchorX = null;
    this.data.animation = key;
    this.manager.SetActiveAnimationName(key, true);

};

/**
 * Sets the animation playback speed
 *
 * @method Phaser.Creature#setAnimationPlaySpeed
 * @memberof Phaser.Creature
 * @param {number} speed - Sets the playback speed
 */
Phaser.Creature.prototype.setAnimationPlaySpeed = function (speed)
{

    if (speed)
    {
        this.timeDelta = speed;
    }

};

/**
* Plays the currently set animation.
*
* @method Phaser.Creature#play
* @memberof Phaser.Creature
* @param {boolean} [loop=false] - Should the animation loop?
*/
Phaser.Creature.prototype.play = function (loop)
{

    if (loop === undefined) { loop = false; }

    this.loop = loop;

    this.manager.SetIsPlaying(true);
    this.manager.RunAtTime(0);

};

/**
* Stops the currently playing animation.
*
* @method Phaser.Creature#stop
* @memberof Phaser.Creature
*/
Phaser.Creature.prototype.stop = function ()
{

    this.manager.SetIsPlaying(false);

};

/**
* @name Phaser.Creature#isPlaying
* @property {boolean} isPlaying - Is the _current_ animation playing?
*/
Object.defineProperty(Phaser.Creature.prototype, 'isPlaying', {

    get: function ()
    {

        return this.manager.GetIsPlaying();

    },

    set: function (value)
    {

        this.manager.SetIsPlaying(value);

    }

});

/**
* @name Phaser.Creature#loop
* @property {boolean} loop - Should the _current_ animation loop or not?
*/
Object.defineProperty(Phaser.Creature.prototype, 'loop', {

    get: function ()
    {

        return this.manager.should_loop;

    },

    set: function (value)
    {

        this.manager.SetShouldLoop(value);

    }

});

/**
 * @name Phaser.Creature#height
 * @property {number} height - Sets the height of the animation
 */
Object.defineProperty(Phaser.Creature.prototype, 'height', {

    get: function ()
    {

        return this.data.height;

    },

    set: function (value)
    {

        var target = this.manager.target_creature;

        var width = this.data.width ? this.data.width : 0;

        var values = target.GetPixelScaling(width, value);
        this.scale.set(values[0], values[1]);
        this.data.height = value;

    }

});

/**
 * @name Phaser.Creature#width
 * @property {number} width - Sets the width of the animation
 */
Object.defineProperty(Phaser.Creature.prototype, 'width', {

    get: function ()
    {

        return this.data.width;

    },

    set: function (value)
    {

        var target = this.manager.target_creature;

        var height = this.data.height ? this.data.height : 0;

        var values = target.GetPixelScaling(value, height);
        this.scale.set(values[0], values[1]);
        this.data.width = value;

    }

});


/**
 * @name Phaser.Creature#anchorX
 * @property {number} anchorX - Sets the anchorX of the animation
 */
Object.defineProperty(Phaser.Creature.prototype, 'anchorX', {

    get: function ()
    {

        return this.data.anchorX;

    },

    set: function (value)
    {

        if (value === 0)
        {
            value = 0.01;
        }

        if (value === 1)
        {
            value = 0.99;
        }

        if (value === this.data.anchorX)
        {
            return;
        }

        var target = this.manager.target_creature;

        this.stop();
        this.manager.RunAtTime(0);

        if (this.data.anchorX)
        {
            target.SetAnchorPoint(-this.data.anchorX, null, this.data.animation);

            this.play(true);
            this.stop();
            this.manager.RunAtTime(0);
        }

        target.SetAnchorPoint(value, null, this.data.animation);
        this.play(true);

        this.data.anchorX = value;
    }

});

/**
 * @name Phaser.Creature#anchorY
 * @property {number} anchorY - Sets the anchorY of the animation
 */
Object.defineProperty(Phaser.Creature.prototype, 'anchorY', {

    get: function ()
    {

        return this.data.anchorY;

    },

    set: function (value)
    {

        if (value === 0)
        {
            value = 0.01;
        }

        if (value === 1)
        {
            value = 0.99;
        }

        if (value === this.data.anchorY)
        {
            return;
        }

        var target = this.manager.target_creature;

        this.stop();
        this.manager.RunAtTime(0);

        if (this.data.anchorY)
        {
            target.SetAnchorPoint(null, -this.data.anchorY, this.data.animation);

            this.play(true);
            this.stop();
            this.manager.RunAtTime(0);
        }

        target.SetAnchorPoint(null, value, this.data.animation);
        this.play(true);

        this.data.anchorY = value;
    }

});

/**
 * @name Phaser.Creature#tint
 * @property {number} tint - Sets the colour tint
 */
Object.defineProperty(Phaser.Creature.prototype, 'tint', {

    get: function ()
    {

        return this.data.tint;

    },

    set: function (value)
    {

        this.data.tint = value;
    }

});

/**
 * @name Phaser.Creature#alpha
 * @property {number} alpha - Sets the opacity
 */
Object.defineProperty(Phaser.Creature.prototype, 'alpha', {

    get: function ()
    {

        return this.data.alpha;

    },

    set: function (value)
    {

        this.data.alpha = value;
    }

});

/**
* Sets whether anchor point transformations are active.
*
* @method Phaser.Creature#setAnchorPointEnabled
* @memberof Phaser.Creature
*/
Phaser.Creature.prototype.setAnchorPointEnabled = function (value)
{
    var target = this.manager.target_creature;
    target.SetAnchorPointEnabled(value);
};

/**
* @method Phaser.Creature#createAllAnimations
* @memberof Phaser.Creature
*/
Phaser.Creature.prototype.createAllAnimations = function (mesh)
{

    if (!this.game.cache.checkJSONKey(mesh))
    {
        console.warn('Phaser.Creature: Invalid mesh key given. Not found in Phaser.Cache');
        return;
    }

    var meshData = this.game.cache.getJSON(mesh, true);

    this.manager.CreateAllAnimations(meshData);
};

/**
* @method Phaser.Creature#setMetaData
* @memberof Phaser.Creature
*/
Phaser.Creature.prototype.setMetaData = function (meta)
{
    if (!this.game.cache.checkJSONKey(meta))
    {

        console.warn('Phaser.Creature: Invalid meta key given. Not found in Phaser.Cache');
        return;

    }

    var metaJson = this.game.cache.getJSON(meta, true);
    var metaData = CreatureModuleUtils.BuildCreatureMetaData(metaJson);

    this._creature.SetMetaData(metaData);

};

/**
* @method Phaser.Creature#enableSkinSwap
* @memberof Phaser.Creature
*/
Phaser.Creature.prototype.enableSkinSwap = function (swapNameIn, active)
{

    var target = this.manager.target_creature;

    if (target.creature_meta_data === null)
    {

        console.warn('Phaser.Creature: Attempting to use skin swapping before setting the meta data. You must use {@link #setMetaData} before using skin swapping functionality.');
        return;

    }

    target.EnableSkinSwap(swapNameIn, active);

    this.indices = new Uint16Array(target.final_skin_swap_indices.length);
    for(var i = 0; i < this.indices.length; i++)
    {

        this.indices[i] = target.final_skin_swap_indices[i];

    }

};

/**
* @method Phaser.Creature#disableSkinSwap
* @memberof Phaser.Creature
*/
Phaser.Creature.prototype.disableSkinSwap = function ()
{

    var target = this.manager.target_creature;

    if (target.creature_meta_data === null)
    {

        console.warn('Phaser.Creature: Attempting to use skin swapping before setting the meta data. You must use {@link #setMetaData} before using skin swapping functionality.');
        return;

    }

    target.DisableSkinSwap();

    this.indices = new Uint16Array(target.global_indices.length);
    for(var i = 0; i < this.indices.length; i++)
    {

        this.indices[i] = target.global_indices[i];

    }

};

/**
* @method Phaser.Creature#setActiveItemSwap
* @memberof Phaser.Creature
*/
Phaser.Creature.prototype.setActiveItemSwap = function (regionName, swapIdx)
{

    var target = this.manager.target_creature;

    target.active_uv_swap_actions[regionName] = swapIdx;

};

/**
* @method Phaser.Creature#removeActiveItemSwap
* @memberof Phaser.Creature
*/
Phaser.Creature.prototype.removeActiveItemSwap = function (regionName)
{

    var target = this.manager.target_creature;

    delete target.active_uv_swap_actions[regionName];

};
