class CardForeignDataModel {
  final String? faceName;
  final String? flavorText;
  final String? identifiers;
  final String? language;
  final int? multiverseId;
  final String? name;
  final String? text;
  final String? type;
  final String? uuid;

  CardForeignDataModel({
    this.faceName,
    this.flavorText,
    this.identifiers,
    this.language,
    this.multiverseId,
    this.name,
    this.text,
    this.type,
    this.uuid,
  });

  factory CardForeignDataModel.fromMap(Map<String, dynamic> map) {
    return CardForeignDataModel(
      faceName: map['faceName'] as String?,
      flavorText: map['flavorText'] as String?,
      identifiers: map['identifiers'] as String?,
      language: map['language'] as String?,
      multiverseId: map['multiverseId'] as int?,
      name: map['name'] as String?,
      text: map['text'] as String?,
      type: map['type'] as String?,
      uuid: map['uuid'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'faceName': faceName,
      'flavorText': flavorText,
      'identifiers': identifiers,
      'language': language,
      'multiverseId': multiverseId,
      'name': name,
      'text': text,
      'type': type,
      'uuid': uuid,
    };
  }
}