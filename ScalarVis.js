//-------------------------------------------------------
// Global variables
var gaussian_kernel = [[2/159.0, 4/159.0 , 5/159.0 , 4/159.0 , 2/159.0],
                       [4/159.0, 9/159.0 , 12/159.0, 9/159.0 , 4/159.0], 
                       [5/159.0, 12/159.0, 15/159.0, 12/159.0, 5/159.0], 
                       [4/159.0, 9/159.0 , 12/159.0, 9/159.0 , 4/159.0], 
                       [2/159.0, 4/159.0 , 5/159.0 , 4/159.0 , 2/159.0]];


var sobel_gx = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
var sobel_gy = [[1, 2, 1], [0, 0, 0], [-1, -2, -1]];
var strongEdges = new Set();
var weakEdges = new Set();


//------------------------------------------------------
//MAIN
function main() {
	//render();
}


function generateMatrix(width,height)
{
	var matrix=[];
	for(i=0; i<width;i++)
	{
		matrix[i] = [];

		for(j=0;j<height;j++)
			matrix[i][j] = 0;
	}
	return matrix;
}

// generate neighbor matrix in kernel size
function neighbors_matrix(image,x,y,neighbor_matrix_size)
{
	var neighbors = generateMatrix(neighbor_matrix_size,neighbor_matrix_size);

	for(i=0;i<neighbor_matrix_size;i++)
	{
		neighbors[i]=[];

		for(j=0;j<neighbor_matrix_size;j++)
		{
			var attempted_x = x - (neighbor_matrix_size - 1)/2 + i;
			var attempted_y = y - (neighbor_matrix_size - 1)/2 + j;

			if(attempted_x>=0 && attempted_x<image.length && attempted_y>=0 && attempted_y<image[0].length)
				neighbors[i][j] = image[attempted_x][attempted_y];
			else
				neighbors[i][j] = 0;
		}
	}

	//console.log(neighbors);

	return neighbors;
}


function convert_to_imgData(grey_matrix)
{
	var res = [];
	for(var h = 0; h<grey_matrix[0].length;h++)
	{
		for(var w=0; w<grey_matrix.length;w++)
		{
			for(var i=0; i<3;i++)
				res.push(grey_matrix[w][h]);

			res.push(255);
		}
	}
	return res;
}


function apply_gaussian_smoothing(grey_image)
{
   var smoothed_img = generateMatrix(grey_image.length,grey_image[0].length);

  for (var w=0;w<smoothed_img.length;w++)
  {
  	for (var h=0;h<smoothed_img[0].length;h++)
  	{
  		var neighbors = neighbors_matrix(grey_image,w,h,5);

  		for(var a = 0; a<5 ; a++)
  		{
  			for(var b = 0; b<5; b++)
  			{
  				smoothed_img[w][h] += neighbors[a][b] * gaussian_kernel[a][b];
  			}
  		}
  	}
  }

  return smoothed_img;
}


function apply_sobel_filter(smoothed_image)
{
   var sobel_img = generateMatrix(smoothed_image.length,smoothed_image[0].length);

  for (var w=0;w<sobel_img.length;w++)
  {
  	for (var h=0;h<sobel_img[0].length;h++)
  	{
  		var neighbors = neighbors_matrix(smoothed_image,w,h,3);
  		var gx = 0;
  		var gy = 0;

  		for(var a = 0; a<3 ; a++)
  		{
  			for(var b = 0; b<3; b++)
  			{
  				gx+=neighbors[a][b] * sobel_gx[a][b];
  				gy+=neighbors[a][b] * sobel_gy[a][b];
  			}
  		}
  		sobel_img[w][h] = Math.sqrt(gx * gx + gy * gy);

  	}
  }

  return sobel_img;
}


function apply_nonMaximum_suppression(sobel_image)
{
   var suppressed_img = generateMatrix(sobel_image.length,sobel_image[0].length);

  for (var w=0;w<suppressed_img.length;w++)
  {
  	for (var h=0;h<suppressed_img[0].length;h++)
  	{
  		var neighbors = neighbors_matrix(sobel_image,w,h,3);

  		//  the rounded gradient angle is 0° (i.e. the edge is in the north–south direction)
  		if(neighbors[1][1]>neighbors[0][1] && neighbors[1][1]>neighbors[2][1])
  			suppressed_img[w][h] = neighbors[1][1];
  		else
  		 	suppressed_img[w][h] = 0;

  		 // the rounded gradient angle is 90° (i.e. the edge is in the east–west direction) 
  		if(neighbors[1][1]>neighbors[1][0] && neighbors[1][1]>neighbors[1][2])
  			suppressed_img[w][h] = neighbors[1][1];
  		else
  		 	suppressed_img[w][h] = 0;

  		// the rounded gradient angle is 135° (i.e. the edge is in the northeast–southwest direction)
  		if(neighbors[1][1]>neighbors[0][2] && neighbors[1][1]>neighbors[2][0])
  			suppressed_img[w][h] = neighbors[1][1];
  		else
  		 	suppressed_img[w][h] = 0;

  		// the rounded gradient angle is 45° (i.e. the edge is in the north west–south east direction)
  		if(neighbors[1][1]>neighbors[0][0] && neighbors[1][1]>neighbors[2][2])
  			suppressed_img[w][h] = neighbors[1][1];
  		else
  		 	suppressed_img[w][h] = 0;
  	}
  }

  return suppressed_img;
}


function indexTo2d(index, width)
{
	return [index-width*(index/width),index/width];
}

function toIndex(w,h,width)
{
	return width*h+w;
}

function edge_tracing(w,h,width,height,strongEdges,weakEdges,visited,connected_edges)
{
	if(w<0 || w>=width || h<0 || h>=height || visited[w][h] == 1)
		return;

	visited[w][h] = 1;

	var index = toIndex(w,h,width);
	if(strongEdges.has(index)||weakEdges.has(index))
		connected_edges.push(index);

	edge_tracing(w-1,h-1,width,height,strongEdges,weakEdges,visited,connected_edges);
	edge_tracing(w-1,h,width,height,strongEdges,weakEdges,visited,connected_edges);
	edge_tracing(w-1,h+1,width,height,strongEdges,weakEdges,visited,connected_edges);
	edge_tracing(w,h-1,width,height,strongEdges,weakEdges,visited,connected_edges);
	edge_tracing(w,h+1,width,height,strongEdges,weakEdges,visited,connected_edges);
	edge_tracing(w+1,h-1,width,height,strongEdges,weakEdges,visited,connected_edges);
	edge_tracing(w+1,h,width,height,strongEdges,weakEdges,visited,connected_edges);
	edge_tracing(w+1,h+1,width,height,strongEdges,weakEdges,visited,connected_edges);
}

function apply_hysteresis(suppressed_image,th,tl)
{
	var final_img = generateMatrix(suppressed_image.length,suppressed_image[0].length);

	var index = 0;
	  // mark all strong edges and suppress all weak edges in the first run
	  for (var h=0;h<final_img[0].length;h++)
	  {
	  	for (var w=0;w<final_img.length;w++)
	  	{
	 		if(suppressed_image[w][h]>=th)
				strongEdges.add(index);
			else if(suppressed_image[w][h]>tl)
				weakEdges.add(index);

			index++;
	  	}
	  }

	  var visited = generateMatrix(suppressed_image.length,suppressed_image[0].length);
	  var connected_edges = new Array();


	  for (let i of strongEdges)
	  {
	  	 console.log("i:"+i);
	  	 var coor = indexTo2d(i,final_img.length);
	  	 edge_tracing(coor[0],coor[1],final_img.length,final_img[0].length,strongEdges,weakEdges,visited,connected_edges)

	  	 for (let j of connected_edges)
	  	 {
	  	 	var a = indexTo2d(j,final_img.length);
	  	 	final_img[a[0]][a[1]] = 255;
	  	 }

	  	 connected_edges = [];
	  }

	  return final_img;
}



//--Function: render-------------------------------------
//Main drawing function

function render(canvas){
  var c=document.getElementById("example");
  var ctx=c.getContext("2d");
  var img=document.getElementById("image");
  ctx.drawImage(img,0,0);

  var imgData=ctx.getImageData(0,0,c.width,c.height);
  var grey_matrix = generateMatrix(c.width,c.height);

  var r,g,b;
  var x=0;
  var y=0;

  for (var i=0;i<imgData.data.length;i+=4)
  {
	  r=imgData.data[i]
	  g=imgData.data[i+1];
	  b=imgData.data[i+2];
	  imgData.data[i+3]=255;
	  // compute grey scale pixel value
	  grey_matrix[x][y] = Math.round(0.299*r+0.587*g+0.114*b);
	  //console.log(grey_matrix[x][y]);

	  if(x == c.width - 1)
	  {
	  	y+=1;
	  	x=0;
	  }
	  else
	  {
	  	x+=1;
	  }
  }


  var smoothed_imgData = ctx.createImageData(c.width, c.height);
  //apply gaussian smoothing
  var smoothed_img = apply_gaussian_smoothing(grey_matrix);
  var sobel_img = apply_sobel_filter(smoothed_img);
  var suppressed_img = apply_nonMaximum_suppression(sobel_img);
  var final_img = apply_hysteresis(suppressed_img,150,100);
  var smoothed_array = convert_to_imgData(final_img);
  for (var n=0;n<smoothed_array.length;n++)
  {
  	smoothed_imgData.data[n] = smoothed_array[n];
  }


  ctx.putImageData(smoothed_imgData,0,0);
}


