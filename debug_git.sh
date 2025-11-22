#!/bin/bash
git remote -v > git_info.txt 2>&1
git status >> git_info.txt 2>&1
