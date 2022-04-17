#static library name lib*.a
TARGET  := libaec.a

#compile and lib parameter
CC      := emcc
AR      = emar
#source file
SOURCE  := $(wildcard *.c) $(wildcard *.cpp)
OBJS    := $(patsubst %.c,%.o,$(patsubst %.cpp,%.o,$(SOURCE)))

.PHONY : objs clean
all : $(TARGET)
objs : $(OBJS)
clean :
	rm -fr *.o
	rm -fr $(TARGET)

$(TARGET) : $(OBJS)
	$(AR) cru $(TARGET) $(OBJS)