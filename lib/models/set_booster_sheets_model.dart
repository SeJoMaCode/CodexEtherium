class SetBoosterSheetsModel {
  final String? boosterName;
  final String? setCode;
  final bool? sheetHasBalanceColors;
  final bool? sheetIsFoil;
  final String? sheetName;

  SetBoosterSheetsModel({
    this.boosterName,
    this.setCode,
    this.sheetHasBalanceColors,
    this.sheetIsFoil,
    this.sheetName,
  });

  static bool? _toBool(dynamic value) {
    if (value == null) return null;
    if (value is bool) return value;
    if (value is int) return value == 1;
    return null;
  }

  factory SetBoosterSheetsModel.fromMap(Map<String, dynamic> map) {
    return SetBoosterSheetsModel(
      boosterName: map['boosterName'] as String?,
      setCode: map['setCode'] as String?,
      sheetHasBalanceColors: _toBool(map['sheetHasBalanceColors']),
      sheetIsFoil: _toBool(map['sheetIsFoil']),
      sheetName: map['sheetName'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'boosterName': boosterName,
      'setCode': setCode,
      'sheetHasBalanceColors': sheetHasBalanceColors,
      'sheetIsFoil': sheetIsFoil,
      'sheetName': sheetName,
    };
  }
}