
import xml.etree.ElementTree as ET
import json
from shapely.geometry import Polygon, LineString, mapping
import re

from svgpathtools import parse_path, Line, CubicBezier, QuadraticBezier

def parse_svg_path(path_string):
    """Parses an SVG path string into a list of Shapely LineStrings or Polygons."""
    path = parse_path(path_string)
    
    coords = []  # List to hold all coordinates

    # Convert path to a series of coordinates
    for segment in path:
        # Discretize the path segment into points
        if isinstance(segment, (Line, CubicBezier, QuadraticBezier)):
            segment_coords = [(segment.point(t).real, segment.point(t).imag) for t in [i / 20.0 for i in range(21)]]
            coords.extend(segment_coords)
    
    # Remove duplicate points if they appear
    coords = list(dict.fromkeys(coords))
    
    return coords


def image_to_cartesian(x, y, width=4000, height=4000):
    """Convert image coordinates to cartesian coordinates with (2000, 2000) as the center."""
    cartesian_x = (x - 2000) / 2000
    cartesian_y = (y - 2000) / 2000
    return cartesian_x, cartesian_y

def svg_to_geojson(svg_content):
    """Converts SVG paths into GeoJSON format."""
    # Parse the SVG content
    root = ET.fromstring(svg_content)
    
    # Create the base GeoJSON structure
    geojson = {
        "type": "FeatureCollection",
        "features": []
    }
    #from 0 0 to 2000, 2000
    
    # Iterate through each 'path' element
    for path in root.findall('.//{http://www.w3.org/2000/svg}path'):
        path_id = path.get('id', 'unknown')
        path_data = path.get('d')
        
        # Parse the path data into a list of coordinates
        coords = parse_svg_path(path_data)
        
        
        if coords:
            # Convert coordinates into a Polygon or LineString
            if coords[0] == coords[-1]:
                # It's a closed path, create a Polygon
                coors2=[image_to_cartesian(c[0],c[1]) for c in coords]
                polygon = Polygon(coors2)
                geometry = mapping(polygon)
            else:
                # It's an open path, create a LineString

                coords.append(coords[0])
                coors2=[image_to_cartesian(c[0],c[1]) for c in coords]
                
                linestring = Polygon(coors2)
                geometry = mapping(linestring)
            
            # Add a new feature to the GeoJSON structure
            feature = {
                "type": "Feature",
                "geometry": geometry,
                "properties": {
                    "id": path_id
                }
            }
            
            geojson["features"].append(feature)
    
    return geojson


def main():
    # Read the SVG file content
    svg_file_path = './src/data/sectors.svg'  # Change to your SVG file path
    with open(svg_file_path, 'r') as svg_file:
        svg_content = svg_file.read()
    
    # Convert SVG to GeoJSON
    geojson_data = svg_to_geojson(svg_content)
    
    # Save GeoJSON to file
    geojson_file_path = './src/data/outputgeo.geojson'
    with open(geojson_file_path, 'w+') as geojson_file:
        json.dump(geojson_data, geojson_file, indent=2)
    
    print(f"GeoJSON saved to {geojson_file_path}")

if __name__ == "__main__":
    main()
