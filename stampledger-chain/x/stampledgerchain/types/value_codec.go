package types

import (
	"encoding/json"
	"fmt"
	"reflect"
)

// JSONValueCodec is a value codec that uses JSON encoding for any type
type JSONValueCodec[T any] struct{}

func NewJSONValueCodec[T any]() JSONValueCodec[T] {
	return JSONValueCodec[T]{}
}

func (c JSONValueCodec[T]) Encode(value T) ([]byte, error) {
	return json.Marshal(value)
}

func (c JSONValueCodec[T]) Decode(b []byte) (T, error) {
	var value T
	err := json.Unmarshal(b, &value)
	return value, err
}

func (c JSONValueCodec[T]) EncodeJSON(value T) ([]byte, error) {
	return json.Marshal(value)
}

func (c JSONValueCodec[T]) DecodeJSON(b []byte) (T, error) {
	var value T
	err := json.Unmarshal(b, &value)
	return value, err
}

func (c JSONValueCodec[T]) Stringify(value T) string {
	b, _ := json.Marshal(value)
	return string(b)
}

func (c JSONValueCodec[T]) ValueType() string {
	var t T
	return fmt.Sprintf("%s", reflect.TypeOf(t).Name())
}
