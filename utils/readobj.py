#!/usr/bin/python3


import argparse
import re


def main():
    parser = argparse.ArgumentParser(description='Lists objects and materials for an OBJ file');
    parser.add_argument("filein", help="The name of the '.obj' file to read")
    args = parser.parse_args();

    ron = re.compile(r'^o\s*$')
    ro = re.compile(r'^o\s+(\S+)\s*$')
    run = re.compile(r'^usemtl\s*$')
    ru = re.compile(r'^usemtl\s+(\S+)\s*$')
    fn = re.compile(r'^f\s+.*$')


    wctl = 0
    namo = "_object_0"
    namu = "_material_0"
    curo = namo
    curu = namu

    ln = 0

    out = set()

    for line in open(args.filein, "r").read().splitlines():
        mato = False
        matu = False
        match = ron.match(line)
        if match:
            mato = True
            wctl += 1
            curo = "_object_" + str(wctl)
        match = ro.match(line)
        if match:
            mato = True
            curo = match.group(1)
        match = run.match(line)
        if match:
            matu = True
            wctl += 1
            curu = "_material_" + str(wctl)
        match = ru.match(line)
        if match:
            matu = True
            curu = match.group(1)
        match = fn.match(line)
        if match:
            ln += 1

        if matu or mato:
            if ln > 0:
                ln = 0
                out.add("%s, %s" % (namo, namu))
            namo = curo
            namu = curu

    if ln > 0:
        ln = 0
        out.add("%s, %s" % (namo, namu))

    for lout in out:
        print(lout)
    

main()

        


        
            
        
