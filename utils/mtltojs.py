#!/usr/bin/python3


import argparse
import re


def main():
    parser = argparse.ArgumentParser(description='Create a javascript code snippet for colors from the MTL file');
    parser.add_argument("filein", help="The name of the '.mtl' file to read")
    parser.add_argument("fileout", help="The name of the '.js' file to write")
    args = parser.parse_args();

    rnewmtl = re.compile(r'^newmtl\s+(\S+)\s*$')
    rkd = re.compile(r'^Kd\s+([0-9.-]+)\s+([0-9.-]+)\s+([0-9.-]+)\s*$')

    curmtl = None
    numcols = 0

    outmtl = []
    numouts = 0

    for line in open(args.filein, "r").read().splitlines():
        match = rnewmtl.match(line)
        if match:
            curmtl = match.group(1)
        match = rkd.match(line)
        if match:
            if curmtl is not None:
                numcols += 1
                outmtl.append([curmtl, match.group(1), match.group(2), match.group(3)])
                curmtl = None



    if numcols == 0:
        print("No materials found")
        return
    #
    # Get numcols up to factor of 2
    # Quick and dirty method
    tsize = numcols
    while (tsize & (tsize - 1)) != 0:
        tsize += 1

    colouts = ["",
               "        // LimpetGE utility generated code readmtl color list",
               "        // Modify to as required",
               "",
               "        colors = ["]

    names = ["",
             "        // Names to color texture controls"];
    
    outs = [""
            "        // The structiure definition",
            "        var structure = new LStuctureDef(SHADER_USED, {colors: colors});",
            "",
            "        //Adding the impoirted components"]

    for nitm in enumerate(outmtl):
        num, itm = nitm
        colouts.append("            [%8s, %8s, %8s, 1.0],    // %s" % (itm[1], itm[2], itm[3], itm[0]))
        names.append ("        var %s = lTextureColor(%d, %4d);" % (itm[0].ljust(20, " "), tsize, num))
        outs.append('        structure.addImport({data: importObj.component("", "%s"), texturecontrol: %s});' % (itm[0], itm[0]))

    for itm in range(numcols, tsize):
        colouts.append("            [0.0, 0.0, 0.0, 0.0],")

    colouts.append("        ];")

    names.append("")

    outs.append("")
    outs.append("        // End of utility generated code")
    outs.append("")

    open(args.fileout, "w").write("\n".join(colouts + names + outs) + "\n")



main()

        


        
            
        
