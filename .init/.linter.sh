#!/bin/bash
cd /home/kavia/workspace/code-generation/modern-to-do-manager-141069-141079/todo_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

