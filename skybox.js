var gl;   
var canvas;
var shaderProgram;

var cubeVertexBuffer;
var cubeTriIndexBuffer;

var teapotVertexPositionBuffer;
var teapotFaceBuffer;
var teapotVertexNormalBuffer;
var objDeg = 0;
var obj2Deg = 0;

//Create Projection matrix
var pMatrix = mat4.create();  
var mvMatrix = mat4.create(); 
var nMatrix = mat4.create();   

// View parameters
var eyePt = vec3.fromValues(0.0,0.0,5.0);
var viewDir = vec3.fromValues(0.0,0.0,-1.0);
var up = vec3.fromValues(0.0,1.0,0.0);
var viewPt = vec3.fromValues(0.0,0.0,0.0);

var diff = vec3.fromValues(0.0,0.0,0.0);

var texID;

var mvMatrixStack = [];

/**
 * Sends Modelview matrix to shader
 */
function uploadModelViewMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}
/**
 * Sends projection matrix to shader
 */
function uploadProjectionMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, 
                      false, pMatrix);
}
//-------------------------------------------------------------------------
/**
* Generates and sends the normal matrix to the shader
*/
function uploadNormalMatrixToShader() {
	nMatrix = mvMatrix
	mat4.transpose(nMatrix,nMatrix);
	mat4.invert(nMatrix,nMatrix);
	gl.uniformMatrix4fv(shaderProgram.nMatrixUniform, false, nMatrix);
}
//----------------------------------------------------------------------------------
/**
* Pushes matrix onto modelview matrix stack
*/
function mvPushMatrix() {
	var copy = mat4.clone(mvMatrix);
	mvMatrixStack.push(copy);
}
//----------------------------------------------------------------------------------
/**
* Pops matrix off of modelview matrix stack
*/
function mvPopMatrix() {
	if (mvMatrixStack.length == 0) {
		throw "Invalid popMatrix!";
	}
	mvMatrix = mvMatrixStack.pop();
}
/**
 * Sends projection/modelview matrices to shader
 */
function setMatrixUniforms() {
    uploadModelViewMatrixToShader();
    uploadProjectionMatrixToShader();
}
/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}
/**
 * Draws the socre ball one face at a time, copying the vertex coords into a VBO for each face.
 */
 
function setupSkyBox(){
	// Create a buffer for the cube's vertices.
  cubeVertexBuffer = gl.createBuffer();
  // Select the cubeVerticesBuffer as the one to apply vertex
  // operations to from here out.
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
  // Now create an array of vertices for the cube.

  var vertices = [
    // Front face
    -1.0, -1.0,  1.0,
     1.0, -1.0,  1.0,
     1.0,  1.0,  1.0,
    -1.0,  1.0,  1.0,

    // Back face
    -1.0, -1.0, -1.0,
    -1.0,  1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0, -1.0, -1.0,

    // Top face
    -1.0,  1.0, -1.0,
    -1.0,  1.0,  1.0,
     1.0,  1.0,  1.0,
     1.0,  1.0, -1.0,

    // Bottom face
    -1.0, -1.0, -1.0,
     1.0, -1.0, -1.0,
     1.0, -1.0,  1.0,
    -1.0, -1.0,  1.0,

    // Right face
     1.0, -1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0,  1.0,  1.0,
     1.0, -1.0,  1.0,
    // Left face
    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0,
    -1.0,  1.0,  1.0,
    -1.0,  1.0, -1.0
  ];

  // Now pass the list of vertices into WebGL to build the shape. We
  // do this by creating a Float32Array from the JavaScript array,
  // then use it to fill the current vertex buffer.
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  // Build the element array buffer; this specifies the indices
  // into the vertex array for each face's vertices.

  cubeTriIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeTriIndexBuffer);

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.

  var cubeVertexIndices = [
    0,  1,  2,      0,  2,  3,    // front
    4,  5,  6,      4,  6,  7,    // back
    8,  9,  10,     8,  10, 11,   // top
    12, 13, 14,     12, 14, 15,   // bottom
    16, 17, 18,     16, 18, 19,   // right
    20, 21, 22,     20, 22, 23    // left
  ]

  // Now send the element array to GL

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
}
function setupBuffers() {
	setupSkyBox();
	readTextFile("teapot_0.obj",getObj);
}

function drawSkyBox(){
	diff[0] = 0.0;
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix );
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeTriIndexBuffer);
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0); 
}
/**
* Draws a teapot from the teapot buffer
*/
function drawTeapot(){
	diff[0] = 1.0;
	gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexPositionBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,teapotVertexPositionBuffer.itemSize,gl.FLOAT, false, 0, 0);

	// Bind normal buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexNormalBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute,teapotVertexNormalBuffer.itemSize,gl.FLOAT, false, 0, 0);
	//draw
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapotFaceBuffer);
	gl.drawElements(gl.TRIANGLES, teapotFaceBuffer.numItems, gl.UNSIGNED_SHORT,0);
}

function draw() {
	var transformVec = vec3.create();
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    mat4.perspective(pMatrix, Math.PI/3, gl.viewportWidth / gl.viewportHeight, 0.1, 200.0);
	
	// We want to look down -z, so create a lookat point in that direction 
	vec3.add(viewPt, eyePt, viewDir);
	// Then generate the lookat matrix and initialize the MV matrix to that view
	mat4.lookAt(mvMatrix,eyePt,viewPt,up); 
	
	uploadLightsToShader([0,1,1],[1.0,0.5,0.0],[1.0,0.5,0.0],[0.0,0.0,0.0],diff);
	
	mvPushMatrix();
	vec3.set(transformVec,10.0,10.0,10.0);
	mat4.scale(mvMatrix,mvMatrix,transformVec);
	mat4.rotateY(mvMatrix,mvMatrix, degToRad(obj2Deg));
	setMatrixUniforms();
    drawSkyBox();
	mvPopMatrix();
	
	mvPushMatrix();
	vec3.set(transformVec,0.0,0.0,-5.0);
	mat4.translate(mvMatrix,mvMatrix,transformVec);
	mat4.rotateY(mvMatrix,mvMatrix, degToRad(objDeg));
	setMatrixUniforms();
	drawTeapot();
	mvPopMatrix();
}

function setupTextures(urls) {
    var ct = 0;
    var img = new Array(6);
    var urls = [
       "posx.jpg", "negx.jpg", 
       "posy.jpg", "negy.jpg", 
       "posz.jpg", "negz.jpg"
    ];
    for (var i = 0; i < 6; i++) {
        img[i] = new Image();
        img[i].onload = function() {
            ct++;
            if (ct == 6) {
                texID = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, texID);
                var targets = [
                   gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 
                   gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 
                   gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z 
                ];
                for (var j = 0; j < 6; j++) {
                    gl.texImage2D(targets[j], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img[j]);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                }
                gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                draw();
            }
        }
        img[i].src = urls[i];
    }
}

/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
 */
function createGLContext(canvas) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i=0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

/**
 * Loads Shaders
 * @param {string} id ID string for shader to load. Either vertex shader/fragment shader
 */
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
  
  // Loop through the children for the found DOM element and
  // build up the shader source code as a string
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
      shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
 
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
 
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader;
}

/**
 * Setup the fragment and vertex shaders
 */
function setupShaders() {
  var vertexShader = loadShaderFromDOM("shader-vs");
  var fragmentShader = loadShaderFromDOM("shader-fs");
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
  
  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
  
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
  
  shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");    
  shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");  
  shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
  shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
  
  shaderProgram.uniformDiffLoc = gl.getUniformLocation(shaderProgram, "diff");
}

function uploadLightsToShader(loc,a,d,s,f) {
	gl.uniform3fv(shaderProgram.uniformLightPositionLoc, loc);
	gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, a);
	gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, d);
	gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, s);
	gl.uniform3fv(shaderProgram.uniformDiffLoc, f);
}

/**
 * Startup function called from html code to start program.
 */
function startup() {
	canvas = document.getElementById("myGLCanvas");
	//Add event listener
	window.addEventListener( 'keydown', onKeyDown, false );
	gl = createGLContext(canvas);
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	
	setupShaders();
	setupBuffers();
    setupTextures();
    tick();
}

function tick() {
	requestAnimFrame(tick);
	draw();
}
//This function handles what happens on an keyboard interrupt.
//@param event - object that contains the keycode of whatever button was just pressed.
function onKeyDown(event)
{
	//rotate teapot on keydown of 'a' key clockwise around y-axis
	if(event.keyCode =="65"){
		objDeg = objDeg - 1;
	}
	//rotate teapot on keydown of 'd' key counterclockwise around y-axis
	if(event.keyCode =="68"){
		objDeg = objDeg + 1;
	}
	//rotate user view on keydown of 'q' key counterclockwise around y-axis
	if(event.keyCode =="81"){
		obj2Deg = obj2Deg - 1;
	}
	//rotate user view on keydown of 'e' key clockwise around y-axis
	if(event.keyCode =="69"){
		obj2Deg = obj2Deg + 1;
	}
}

function getObj(objIn) {
	var teapotSoup = [];
	var teapotFaces = [];
	var list = objIn.split("\n");
	var re = /\s\s*/;
	for(var i=0; i < list.length; i++){
		var nList = list[i].split(re);
		if(nList[0] == 'v'){
			teapotSoup.push(parseFloat(nList[1]));
			teapotSoup.push(parseFloat(nList[2]));
			teapotSoup.push(parseFloat(nList[3]));
		}
		if(nList[0] == 'f'){
			teapotFaces.push(parseFloat(nList[1])-1);
			teapotFaces.push(parseFloat(nList[2])-1);
			teapotFaces.push(parseFloat(nList[3])-1);
		}
	}
	//Calculate the normals
	var normalArray = [];
	for(var i=0; i < teapotSoup.length; i++){
		normalArray.push(0);
	}
	setNorms(teapotFaces,teapotSoup,normalArray);
	
	//setup buffers
	teapotVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapotSoup), gl.STATIC_DRAW);
	teapotVertexPositionBuffer.itemSize = 3;
	teapotVertexPositionBuffer.numItems = teapotSoup.length;
	
	teapotFaceBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapotFaceBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(teapotFaces), gl.STATIC_DRAW);
	teapotFaceBuffer.itemSize = 1;
	teapotFaceBuffer.numItems = teapotFaces.length;
	
	teapotVertexNormalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexNormalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalArray),gl.STATIC_DRAW);
	teapotVertexNormalBuffer.itemSize = 3;
	teapotVertexNormalBuffer.numItems = normalArray.length;
}

//-------------------------------------------------------------------------
//sets the normals of the new terrian FILL OUT THIS FUNCTION
function setNorms(faceArray, vertexArray, normalArray)
{
	for(var i=0; i<faceArray.length;i+=3)
    {
        //find the face normal
        var vertex1 = vec3.fromValues(vertexArray[faceArray[i]*3],vertexArray[faceArray[i]*3+1],vertexArray[faceArray[i]*3+2]);
        
        var vertex2 = vec3.fromValues(vertexArray[faceArray[i+1]*3],vertexArray[faceArray[i+1]*3+1],vertexArray[faceArray[i+1]*3+2]);
        
        var vertex3 = vec3.fromValues(vertexArray[faceArray[i+2]*3],vertexArray[faceArray[i+2]*3+1],vertexArray[faceArray[i+2]*3+2]);
        
        var vect31=vec3.create(), vect21=vec3.create();
        vec3.sub(vect21,vertex2,vertex1);
        vec3.sub(vect31,vertex3,vertex1)
        var v=vec3.create();
        vec3.cross(v,vect21,vect31);
		
		//add the face normal to all the faces vertices
        normalArray[faceArray[i]*3  ]+=v[0];
        normalArray[faceArray[i]*3+1]+=v[1];
        normalArray[faceArray[i]*3+2]+=v[2];

        normalArray[faceArray[i+1]*3]+=v[0];
        normalArray[faceArray[i+1]*3+1]+=v[1];
        normalArray[faceArray[i+1]*3+2]+=v[2];

        normalArray[faceArray[i+2]*3]+=v[0];
        normalArray[faceArray[i+2]*3+1]+=v[1];
        normalArray[faceArray[i+2]*3+2]+=v[2];
	}
	
	//normalize each vertex normal
    for(var i=0; i<normalArray.length;i+=3)
    {
        var v = vec3.fromValues(normalArray[i],normalArray[i+1],normalArray[i+2]); 
        vec3.normalize(v,v);
        
        normalArray[i  ]=v[0];
        normalArray[i+1]=v[1];
        normalArray[i+2]=v[2];
    }
    
}

/**
 * Gets a file from the server for processing on the client side.
 *
 * @param  file A string that is the name of the file to get
 * @param  callbackFunction The name of function (NOT a string) that will receive a string holding the file
 *         contents.
 *
 */
function readTextFile(file, callbackFunction)
{
    console.log("reading "+ file);
    var rawFile = new XMLHttpRequest();
    var allText = [];
    rawFile.open("GET", file, true);
    
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                 callbackFunction(rawFile.responseText);
                 console.log("Got text file!");
                 
            }
        }
    }
    rawFile.send(null);
}