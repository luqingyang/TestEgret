@echo off
if exist error.txt  del error.txt /f /q

echo ���ڱ�����Ŀ...[��ɺ��Զ��رձ�����,��������,��־�������error.txt��]
egret create_manifest -all
egret build
